import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserPlus,
  Search,
  FilterX,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  employeeService,
  EmployeeResponse,
  PageParams,
} from "@/services/employeeService";
import { SYSTEM_MESSAGES } from "@/constants/messages";
// Import Modals
import EmployeeDetailModal from "./EmployeeDetailModal";
import EmployeeFormModal from "./components/EmployeeFormModal";
import ConfirmOfficialModal from "./ConfirmOfficialModal";
import { EMPLOYEE_CONSTANTS } from "../../constants/employee.constants";

const PAGE_SIZE = SYSTEM_MESSAGES.COMMON.DEFAULT_PAGE_SIZE;

export default function EmployeeManagementPage() {
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [totalElements, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isArchivedTab, setIsArchivedTab] = useState(false);

  const [openDetail, setOpenDetail] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openConfirmOfficial, setOpenConfirmOfficial] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeResponse | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to first page when filter/search changes
  useEffect(() => {
    setPage(0);
  }, [statusFilter, searchDebounced, isArchivedTab]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params: PageParams = {
        page,
        size: PAGE_SIZE,
        search: searchDebounced || undefined,
        status: isArchivedTab ? undefined : statusFilter || undefined,
        includeDeleted: isArchivedTab ? true : undefined,
      };
      const res = await employeeService.getAllEmployees(params);
      setEmployees(res.content);
      setTotal(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (error) {
      console.error("Failed to fetch employees", error);
      toast.error(SYSTEM_MESSAGES.API_ERROR);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchDebounced, isArchivedTab]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleDelete = (id: number) => {
    toast.custom(
      (t) => (
        <div className="bg-card border border-border rounded-2xl shadow-xl p-5 w-[360px] animate-in slide-in-from-right-full">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="text-destructive" size={20} />
            </div>

            <div className="flex-1">
              <p className="font-bold text-foreground text-base">
                {SYSTEM_MESSAGES.EMPLOYEE.MSG_DELETE_CONFIRM}
              </p>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {SYSTEM_MESSAGES.EMPLOYEE.MSG_DELETE_DESC}
              </p>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => toast.dismiss(t)}
                  className="px-4 py-2 rounded-xl bg-muted text-muted-foreground font-semibold hover:bg-muted/80 transition"
                >
                  {SYSTEM_MESSAGES.BTN_CANCEL}
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90 shadow-md shadow-destructive/20 transition"
                  onClick={async () => {
                    toast.dismiss(t);
                    try {
                      await employeeService.deleteEmployee(id);
                      toast.success(
                        SYSTEM_MESSAGES.EMPLOYEE.MSG_DELETE_SUCCESS,
                      );
                      fetchList();
                    } catch (error: any) {
                      const errorMsg =
                        error.response?.data?.message ||
                        SYSTEM_MESSAGES.EMPLOYEE.MSG_DELETE_ERROR;
                      toast.error(errorMsg);
                    }
                  }}
                >
                  {SYSTEM_MESSAGES.BTN_DELETE}
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
      { duration: 6000 },
    );
  };

  const handleRestore = (id: number) => {
    toast.custom(
      (t) => (
        <div className="bg-card border border-border rounded-2xl shadow-xl p-5 w-[360px] animate-in slide-in-from-right-full">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
              <RotateCcw className="text-green-600" size={20} />
            </div>

            <div className="flex-1">
              <p className="font-bold text-foreground text-base">
                {SYSTEM_MESSAGES.EMPLOYEE.TITLE_RESTORE}
              </p>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {SYSTEM_MESSAGES.EMPLOYEE.MSG_RESTORE_DESC}
              </p>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => toast.dismiss(t)}
                  className="px-4 py-2 rounded-xl bg-muted text-muted-foreground font-semibold hover:bg-muted/80 transition"
                >
                  {SYSTEM_MESSAGES.BTN_CANCEL}
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 shadow-md shadow-green-600/20 transition"
                  onClick={async () => {
                    toast.dismiss(t);
                    try {
                      await employeeService.restoreEmployee(id);
                      toast.success(
                        SYSTEM_MESSAGES.EMPLOYEE.MSG_RESTORE_SUCCESS,
                      );
                      fetchList();
                    } catch (error: any) {
                      const errorMsg =
                        error.response?.data?.message ||
                        SYSTEM_MESSAGES.EMPLOYEE.MSG_RESTORE_ERROR;
                      toast.error(errorMsg);
                    }
                  }}
                >
                  {SYSTEM_MESSAGES.BTN_RESTORE}
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
      { duration: 6000 },
    );
  };

  const handleOpenDetail = (emp: EmployeeResponse) => {
    setSelectedId(emp.id);
    setSelectedEmployee(emp);
    setOpenDetail(true);
  };

  const handleOpenEdit = (emp: EmployeeResponse) => {
    setSelectedId(emp.id);
    setSelectedEmployee(emp);
    setOpenEdit(true);
  };

  const handleOpenConfirmOfficial = (emp: EmployeeResponse) => {
    setSelectedId(emp.id);
    setSelectedEmployee(emp);
    setOpenConfirmOfficial(true);
  };

  /**
   * WorkStatus: Normalizes backend status to three main frontend types
   */
  const getWorkStatus = (emp: EmployeeResponse) =>
    emp.workStatus ?? (emp.status as keyof typeof EMPLOYEE_CONSTANTS.STATUS);

  const getWorkStatusMeta = (status: string | null) => {
    if (status === EMPLOYEE_CONSTANTS.STATUS.PROBATION) {
      return {
        label: SYSTEM_MESSAGES.EMPLOYEE.STATUS_PROBATION,
        className:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      };
    }

    if (status === EMPLOYEE_CONSTANTS.STATUS.ACTIVE) {
      return {
        label: SYSTEM_MESSAGES.EMPLOYEE.STATUS_ACTIVE,
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      };
    }

    return {
      label: SYSTEM_MESSAGES.EMPLOYEE.STATUS_INACTIVE,
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
  };

  const from = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <>
      <main className="flex flex-1 flex-col p-6 gap-6 bg-background">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="page-heading">{EMPLOYEE_CONSTANTS.TITLE_MGMT}</h1>
            <p className="text-sm text-muted-foreground">
              {EMPLOYEE_CONSTANTS.DESC_MGMT}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder={SYSTEM_MESSAGES.SEARCH_PLACEHOLDER}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
              />
            </div>

            <button
              onClick={() => setOpenCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition shadow-sm shadow-primary/20 active:scale-95"
            >
              <UserPlus size={18} />
              <span className="hidden sm:inline">
                {EMPLOYEE_CONSTANTS.BTNS.ADD}
              </span>
            </button>
          </div>
        </div>

        {/* FILTERS & STATS */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsArchivedTab(false);
                setStatusFilter("");
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                !isArchivedTab && statusFilter === ""
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-card text-muted-foreground border border-border hover:bg-muted"
              }`}
            >
              {SYSTEM_MESSAGES.LABEL_ALL}
            </button>
            <button
              onClick={() => {
                setIsArchivedTab(false);
                setStatusFilter(EMPLOYEE_CONSTANTS.STATUS.ACTIVE);
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                !isArchivedTab &&
                statusFilter === EMPLOYEE_CONSTANTS.STATUS.ACTIVE
                  ? "bg-green-50/50 text-green-600 border border-green-200"
                  : "bg-card text-muted-foreground border border-border hover:bg-muted"
              }`}
            >
              {SYSTEM_MESSAGES.EMPLOYEE.STATUS_ACTIVE}
            </button>
            <button
              onClick={() => {
                setIsArchivedTab(false);
                setStatusFilter(EMPLOYEE_CONSTANTS.STATUS.PROBATION);
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                !isArchivedTab &&
                statusFilter === EMPLOYEE_CONSTANTS.STATUS.PROBATION
                  ? "bg-amber-50/50 text-amber-700 border border-amber-200"
                  : "bg-card text-muted-foreground border border-border hover:bg-muted"
              }`}
            >
              {SYSTEM_MESSAGES.EMPLOYEE.STATUS_PROBATION}
            </button>
            <button
              onClick={() => setIsArchivedTab(true)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                isArchivedTab
                  ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-600"
                  : "bg-card text-muted-foreground border border-border hover:bg-muted"
              }`}
            >
              <RotateCcw size={14} />
              {SYSTEM_MESSAGES.EMPLOYEE.TAB_ARCHIVED}
            </button>

            {(statusFilter || search) && !isArchivedTab && (
              <button
                onClick={() => {
                  setStatusFilter("");
                  setSearch("");
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition ml-2"
              >
                <FilterX size={14} />
                {EMPLOYEE_CONSTANTS.BTNS.CLEAR_FILTER}
              </button>
            )}
          </div>

          <div className="text-sm font-medium text-muted-foreground bg-card px-3 py-1.5 rounded-lg border border-border">
            {EMPLOYEE_CONSTANTS.VIEW.TOTAL}{" "}
            <span className="text-foreground">{totalElements}</span>{" "}
            {EMPLOYEE_CONSTANTS.VIEW.UNIT}
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="overflow-x-auto text-nowrap">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">
                    {EMPLOYEE_CONSTANTS.LABELS.EMP_CODE}
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">
                    {EMPLOYEE_CONSTANTS.LABELS.FULL_NAME}
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">
                    {EMPLOYEE_CONSTANTS.LABELS.DEPARTMENT}
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">
                    {EMPLOYEE_CONSTANTS.LABELS.POSITION}
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">
                    {SYSTEM_MESSAGES.LABEL_STATUS}
                  </th>
                  <th className="px-6 py-4 text-right font-semibold uppercase tracking-wider text-[11px]">
                    {SYSTEM_MESSAGES.LABEL_ACTION}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-20 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="animate-pulse">
                          {SYSTEM_MESSAGES.LOADING}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-20 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-10 h-10 text-muted-foreground/30" />
                        <p>{SYSTEM_MESSAGES.NO_DATA}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const isArchived = emp.isDeleted === true;
                    const workStatus = getWorkStatus(emp);
                    const statusMeta = getWorkStatusMeta(workStatus);

                    return (
                      <tr
                        key={emp.id}
                        className={`group hover:bg-muted/30 transition-colors ${isArchived ? "opacity-60 bg-gray-50/50 dark:bg-gray-900/20" : ""}`}
                      >
                        <td className="px-6 py-4 font-bold text-primary">
                          {emp.employeeCode}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0 border border-border">
                              {emp.avatarUrl ? (
                                <img
                                  src={emp.avatarUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">
                                  {emp.firstName?.[0]}
                                  {emp.lastName?.[0]}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {emp.firstName} {emp.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {emp.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {emp.department}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {emp.position}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusMeta.className}`}
                            >
                              {statusMeta.label}
                            </span>
                            {isArchived && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                {SYSTEM_MESSAGES.EMPLOYEE.STATUS_TERMINATED}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isArchived ? (
                              <>
                                <button
                                  onClick={() => handleOpenDetail(emp)}
                                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition"
                                  title={SYSTEM_MESSAGES.APPROVE.VIEW_DETAIL}
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  onClick={() => handleRestore(emp.id)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-green-600 border border-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition"
                                  title={SYSTEM_MESSAGES.EMPLOYEE.TITLE_RESTORE}
                                >
                                  <RotateCcw size={14} />
                                  {SYSTEM_MESSAGES.BTN_RESTORE}
                                </button>
                              </>
                            ) : (
                              <>
                                {workStatus ===
                                  EMPLOYEE_CONSTANTS.STATUS.PROBATION && (
                                  <button
                                    onClick={() =>
                                      handleOpenConfirmOfficial(emp)
                                    }
                                    className="px-2.5 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition"
                                    title={
                                      SYSTEM_MESSAGES.EMPLOYEE
                                        .BTN_CONFIRM_OFFICIAL
                                    }
                                  >
                                    {
                                      SYSTEM_MESSAGES.EMPLOYEE
                                        .BTN_CONFIRM_OFFICIAL
                                    }
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenDetail(emp)}
                                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition"
                                  title={SYSTEM_MESSAGES.APPROVE.VIEW_DETAIL}
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(emp)}
                                  className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                  title={SYSTEM_MESSAGES.BTN_EDIT}
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  onClick={() => handleDelete(emp.id)}
                                  className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                  title={SYSTEM_MESSAGES.BTN_DELETE}
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="mt-auto flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20 text-sm">
            <div className="text-muted-foreground">
              {totalElements === 0
                ? SYSTEM_MESSAGES.NO_DATA
                : `${SYSTEM_MESSAGES.ASSET.PAGINATION_SHOW} ${from}–${to} ${SYSTEM_MESSAGES.ASSET.PAGINATION_ON} ${totalElements} ${EMPLOYEE_CONSTANTS.VIEW.UNIT}`}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 transition"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pg = i;
                if (totalPages > 5) {
                  if (page > 2) {
                    pg = page - 2 + i;
                  }
                  if (pg >= totalPages) {
                    pg = totalPages - 5 + i;
                  }
                }
                if (pg < 0 || pg >= totalPages) {
                  return null;
                }

                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-9 h-9 rounded-lg font-bold transition ${
                      pg === page
                        ? "bg-primary text-white shadow-md shadow-primary/30"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {pg + 1}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      <EmployeeFormModal
        open={openCreate}
        mode="create"
        onClose={() => setOpenCreate(false)}
        onSuccess={() => {
          fetchList();
          setOpenCreate(false);
        }}
      />
      <EmployeeDetailModal
        open={openDetail}
        employeeId={selectedId}
        onClose={() => setOpenDetail(false)}
      />
      <EmployeeFormModal
        open={openEdit}
        mode="edit"
        employeeId={selectedId}
        employee={selectedEmployee}
        onClose={() => setOpenEdit(false)}
        onSuccess={() => {
          fetchList();
          setOpenEdit(false);
        }}
      />
      <ConfirmOfficialModal
        open={openConfirmOfficial}
        employee={selectedEmployee}
        onClose={() => setOpenConfirmOfficial(false)}
        onSuccess={() => {
          fetchList();
          setOpenConfirmOfficial(false);
        }}
      />
    </>
  );
}

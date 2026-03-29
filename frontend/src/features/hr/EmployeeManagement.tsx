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
  }, [statusFilter, searchDebounced]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params: PageParams = {
        page,
        size: PAGE_SIZE,
        search: searchDebounced || undefined,
        status: statusFilter || undefined,
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
  }, [page, statusFilter, searchDebounced]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleDelete = (id: number) => {
    toast.custom(
      (t) => (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-5 w-[360px] animate-in slide-in-from-right-full">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle
                className="text-red-600 dark:text-red-500"
                size={20}
              />
            </div>

            <div className="flex-1">
              <p className="font-bold text-gray-900 dark:text-white text-base">
                {SYSTEM_MESSAGES.EMPLOYEE.MSG_DELETE_CONFIRM}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                {SYSTEM_MESSAGES.EMPLOYEE.MSG_DELETE_DESC}
              </p>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => toast.dismiss(t)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  {SYSTEM_MESSAGES.BTN_CANCEL}
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 shadow-md shadow-red-500/20 transition"
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

  const getWorkStatus = (emp: EmployeeResponse) =>
    emp.workStatus ?? (emp.status as "PROBATION" | "ACTIVE" | "TERMINATED");

  const getWorkStatusMeta = (status: string | null) => {
    if (status === "PROBATION") {
      return {
        label: "Thử việc",
        className:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      };
    }

    if (status === "ACTIVE") {
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
      <main className="flex flex-1 flex-col p-6 gap-6 bg-gray-50 dark:bg-gray-950">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="page-heading">{SYSTEM_MESSAGES.EMPLOYEE.TITLE}</h1>
            <p className="text-sm text-gray-500">
              {SYSTEM_MESSAGES.EMPLOYEE.DESC_MGMT}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                placeholder={SYSTEM_MESSAGES.SEARCH_PLACEHOLDER}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            <button
              onClick={() => setOpenCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition shadow-sm shadow-primary/20"
            >
              <UserPlus size={18} />
              <span className="hidden sm:inline">
                {SYSTEM_MESSAGES.EMPLOYEE.BTN_ADD}
              </span>
            </button>
          </div>
        </div>

        {/* FILTERS & STATS */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter("")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                statusFilter === ""
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50"
              }`}
            >
              {SYSTEM_MESSAGES.LABEL_ALL}
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                statusFilter === "ACTIVE"
                  ? "bg-green-50 text-green-600 border border-green-200"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50"
              }`}
            >
              {SYSTEM_MESSAGES.EMPLOYEE.STATUS_ACTIVE}
            </button>
            <button
              onClick={() => setStatusFilter("PROBATION")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                statusFilter === "PROBATION"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50"
              }`}
            >
              Thử việc
            </button>

            {(statusFilter || search) && (
              <button
                onClick={() => {
                  setStatusFilter("");
                  setSearch("");
                }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition ml-2"
              >
                <FilterX size={14} />
                {SYSTEM_MESSAGES.EMPLOYEE.BTN_CLEAR_FILTER}
              </button>
            )}
          </div>

          <div className="text-sm font-medium text-gray-500 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
            {SYSTEM_MESSAGES.EMPLOYEE.LABEL_TOTAL}{" "}
            <span className="text-gray-900 dark:text-white">
              {totalElements}
            </span>{" "}
            {SYSTEM_MESSAGES.EMPLOYEE.LABEL_UNIT}
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="overflow-x-auto text-nowrap">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    {SYSTEM_MESSAGES.EMPLOYEE.LABEL_EMP_CODE}
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    {SYSTEM_MESSAGES.EMPLOYEE.LABEL_NAME}
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    {SYSTEM_MESSAGES.EMPLOYEE.LABEL_DEPARTMENT}
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    {SYSTEM_MESSAGES.EMPLOYEE.LABEL_POSITION}
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    {SYSTEM_MESSAGES.LABEL_STATUS}
                  </th>
                  <th className="px-6 py-4 text-right font-semibold">
                    {SYSTEM_MESSAGES.LABEL_ACTION}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-gray-400">
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
                    <td colSpan={6} className="py-20 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-10 h-10 text-gray-200" />
                        <p>{SYSTEM_MESSAGES.NO_DATA}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const workStatus = getWorkStatus(emp);
                    const statusMeta = getWorkStatusMeta(workStatus);

                    return (
                      <tr
                        key={emp.id}
                        className="group hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-primary">
                          {emp.employeeCode}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
                              {emp.avatarUrl ? (
                                <img
                                  src={emp.avatarUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                                  {emp.firstName.charAt(0)}
                                  {emp.lastName.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                {emp.firstName} {emp.lastName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {emp.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {emp.department}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {emp.position}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {workStatus === "PROBATION" && (
                              <button
                                onClick={() => handleOpenConfirmOfficial(emp)}
                                className="px-2.5 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition"
                                title="Xác nhận chính thức"
                              >
                                Xác nhận chính thức
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenDetail(emp)}
                              className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition"
                              title={SYSTEM_MESSAGES.APPROVE.VIEW_DETAIL}
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(emp)}
                              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                              title={SYSTEM_MESSAGES.BTN_EDIT}
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(emp.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              title={SYSTEM_MESSAGES.BTN_DELETE}
                            >
                              <Trash2 size={18} />
                            </button>
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
          <div className="mt-auto flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 text-sm">
            <div className="text-gray-500">
              {totalElements === 0
                ? SYSTEM_MESSAGES.NO_DATA
                : `${SYSTEM_MESSAGES.ASSET.PAGINATION_SHOW} ${from}–${to} ${SYSTEM_MESSAGES.ASSET.PAGINATION_ON} ${totalElements} ${SYSTEM_MESSAGES.EMPLOYEE.LABEL_UNIT}`}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 transition"
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
                        : "hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {pg + 1}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 transition"
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

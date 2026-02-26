import React, { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, differenceInYears } from "date-fns"
import {
    CalendarIcon, UploadCloud, FileText, Image as ImageIcon, X,
    MapPin, ShieldCheck, Download, Briefcase
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const TEXT = {
    breadcrumb: "Cổng thông tin > Hồ sơ của tôi",
    title: "Thông tin cá nhân",
    btnCancel: "Hủy thay đổi",
    btnUpdate: "Cập nhật hồ sơ",
    modalSuccess: "Cập nhật thông tin thành công!",
    departmentPrefix: "Phòng ",
    officeLocation: "Văn phòng Hà Nội",
    empCodeLabel: "Mã nhân viên",
    managerLabel: "Quản lý trực tiếp",
    sectionContact: "Thông tin liên hệ & Cá nhân",
    labelFullName: "Họ và tên",
    placeholderFullName: "Nhập họ và tên",
    labelEmail: "Email công ty",
    labelNationalId: "CCCD/CMND",
    labelPhone: "Số điện thoại (Tùy chọn)",
    labelDob: "Ngày sinh",
    selectDate: "Chọn ngày",
    sectionJob: "Thông tin công việc",
    labelWorkStatus: "Trạng thái làm việc",
    placeholderStatus: "Chọn trạng thái",
    statusActive: "Đang làm việc",
    statusInactive: "Nghỉ việc",
    statusSuspended: "Đình chỉ",
    labelDepartment: "Phòng ban",
    placeholderDepartment: "Chọn phòng ban",
    deptDesign: "Thiết kế sản phẩm",
    deptEngineering: "Kỹ thuật",
    deptHR: "Nhân sự",
    deptMarketing: "Marketing",
    labelRole: "Vị trí công việc",
    placeholderRole: "Chọn vị trí",
    roleDesigner: "Chuyên viên UI/UX",
    roleFrontend: "Kỹ sư Frontend",
    roleBackend: "Kỹ sư Backend",
    roleManager: "Quản lý sản phẩm",
    labelContract: "Loại hợp đồng",
    placeholderContract: "Chọn loại hợp đồng",
    contractFullTime: "Toàn thời gian",
    contractPartTime: "Bán thời gian",
    contractProbation: "Hợp đồng thử việc",
    contractIntern: "Thực tập sinh",
    placeholderManager: "Chọn quản lý",
    labelStartDate: "Ngày bắt đầu",
    labelEndDate: "Ngày kết thúc (Tùy chọn)",
    sectionDocs: "Tài liệu của tôi",
    fileSigned: "Đã ký • Thg 8, 2021",
    fileVerified: "Đã xác minh • Thg 8, 2021",
    labelUploadNew: "Tải lên tài liệu mới",
    dragDrop: "Kéo & thả tệp vào đây",
    orBrowse: "hoặc nhấn để duyệt tệp",
    allowedFormats: "Định dạng cho phép: PDF, JPG, PNG",
    maxSize: "Kích thước tối đa: 50MB",
    readyUploadPrefix: "Sẵn sàng tải lên (",
    readyUploadSuffix: ")",
    mbText: " MB",
    statsTitle: "Thống kê nhanh",
    statsLeaveLabel: "Ngày phép còn lại",
    statsAttendanceLabel: "Chuyên cần",
    percentSign: "%"
}

const profileSchema = z.object({
    employeeCode: z.string(),
    fullName: z.string().min(2, "Họ tên phải từ 2 ký tự").max(255, "Họ tên không quá 255 ký tự"),
    nationalId: z.string().regex(/^(\d{9}|\d{12})$/, "CMND/CCCD phải là 9 hoặc 12 số"),
    companyEmail: z.string().email("Email không hợp lệ"),
    phoneNumber: z.string().regex(/^\d{10,13}$/, "SĐT phải từ 10-13 số").optional().or(z.literal("")),
    dateOfBirth: z.date({
        message: "Vui lòng chọn ngày sinh",
    }).refine((date) => differenceInYears(new Date(), date) >= 18, "Nhân viên phải từ 18 tuổi trở lên"),
    contractType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]),
    startDate: z.date({
        message: "Vui lòng chọn ngày bắt đầu",
    }),
    endDate: z.date().optional().nullable(),
    department: z.string().min(1, "Vui lòng chọn phòng ban"),
    jobRole: z.string().min(1, "Vui lòng chọn vị trí"),
    lineManager: z.string().min(1, "Vui lòng chọn quản lý"),
    workStatus: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
})

type ProfileFormValues = z.infer<typeof profileSchema>

const defaultValues: Partial<ProfileFormValues> = {
    employeeCode: "NV-10293",
    fullName: "Nguyễn Văn An",
    nationalId: "012345678912",
    companyEmail: "an.nguyen@company.com",
    phoneNumber: "0912345678",
    dateOfBirth: new Date(1995, 5, 15),
    contractType: "FULL_TIME",
    startDate: new Date(2021, 7, 12),
    department: "Product Design",
    jobRole: "Senior UI/UX Designer",
    lineManager: "Michael Scott",
    workStatus: "ACTIVE",
}

export default function EmployeeDashboard() {
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues,
        mode: "onChange",
    })

    function onSubmit(data: ProfileFormValues) {
        console.log("Form submitted: ", data)
        alert(TEXT.modalSuccess)
    }

    const [dragActive, setDragActive] = useState(false)
    const [files, setFiles] = useState<File[]>([])

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFiles = Array.from(e.dataTransfer.files).filter(file => {
                const isValidType = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type);
                const isValidSize = file.size <= 50 * 1024 * 1024;
                return isValidType && isValidSize;
            });
            setFiles((prev) => [...prev, ...droppedFiles])
        }
    }, [])

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files).filter(file => {
                const isValidType = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type);
                const isValidSize = file.size <= 50 * 1024 * 1024;
                return isValidType && isValidSize;
            });
            setFiles((prev) => [...prev, ...selectedFiles])
        }
    }

    return (
        <SidebarProvider>
            <AppSidebar role="employee" variant="inset" />
            <SidebarInset>
                <SiteHeader />

                <main className="flex flex-1 flex-col p-4 md:p-8 bg-gray-50/50 dark:bg-background-dark min-h-screen">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{TEXT.breadcrumb}</p>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                {TEXT.title}
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="font-semibold" onClick={() => form.reset()}>
                                {TEXT.btnCancel}
                            </Button>
                            <Button onClick={form.handleSubmit(onSubmit)} className="font-bold bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all">
                                {TEXT.btnUpdate}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 mb-6 border shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg relative">
                                <img src="https://i.pravatar.cc/150?u=sarah" alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            <div className="text-center md:text-left pt-2">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                                    <h2 className="text-2xl font-bold">{form.watch("fullName")}</h2>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">
                                        {form.watch("contractType").replace("_", " ")}
                                    </span>
                                </div>
                                <p className="text-muted-foreground font-medium">
                                    {form.watch("jobRole")} &bull; {TEXT.departmentPrefix}{form.watch("department")}
                                </p>
                                <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" /> {TEXT.officeLocation}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-row md:flex-col gap-6 md:gap-4 md:text-right text-left bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-xl border">
                            <div>
                                <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase">{TEXT.empCodeLabel}</p>
                                <p className="font-bold">{form.watch("employeeCode")}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase">{TEXT.managerLabel}</p>
                                <div className="flex items-center gap-2">
                                    <img src="https://i.pravatar.cc/150?u=michael" className="w-6 h-6 rounded-full" />
                                    <p className="font-bold">{form.watch("lineManager")}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border shadow-sm">
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-4">
                                        <ShieldCheck className="w-5 h-5 text-primary" />
                                        {TEXT.sectionContact}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="fullName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-gray-700">{TEXT.labelFullName}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={TEXT.placeholderFullName} {...field} className="bg-gray-50/50" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="companyEmail"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-gray-700">{TEXT.labelEmail}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="email@company.com" {...field} className="bg-gray-50/50" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="nationalId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-gray-700">{TEXT.labelNationalId}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="012345678912" {...field} className="bg-gray-50/50" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="phoneNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-gray-700">{TEXT.labelPhone}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="0912345678" {...field} className="bg-gray-50/50" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="dateOfBirth"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col pt-1">
                                                    <FormLabel className="font-bold text-gray-700">{TEXT.labelDob}</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-full pl-3 text-left font-normal bg-gray-50/50",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? format(field.value, "PPP") : <span>{TEXT.selectDate}</span>}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value}
                                                                onSelect={field.onChange}
                                                                disabled={(date) =>
                                                                    date > new Date() || date < new Date("1900-01-01")
                                                                }
                                                                defaultMonth={field.value}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border shadow-sm">
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-4">
                                        <Briefcase className="w-5 h-5 text-primary" />
                                        {TEXT.sectionJob}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="employeeCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-gray-700">{TEXT.empCodeLabel}</FormLabel>
                                                    <FormControl>
                                                        <Input disabled {...field} className="bg-gray-100 dark:bg-gray-800" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="workStatus"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-gray-700">{TEXT.labelWorkStatus}</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-gray-50/50">
                                                                <SelectValue placeholder={TEXT.placeholderStatus} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="ACTIVE">{TEXT.statusActive}</SelectItem>
                                                            <SelectItem value="INACTIVE">{TEXT.statusInactive}</SelectItem>
                                                            <SelectItem value="SUSPENDED">{TEXT.statusSuspended}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="department"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-gray-700">{TEXT.labelDepartment}</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-gray-50/50">
                                                                <SelectValue placeholder={TEXT.placeholderDepartment} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Product Design">{TEXT.deptDesign}</SelectItem>
                                                            <SelectItem value="Engineering">{TEXT.deptEngineering}</SelectItem>
                                                            <SelectItem value="Human Resources">{TEXT.deptHR}</SelectItem>
                                                            <SelectItem value="Marketing">{TEXT.deptMarketing}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="jobRole"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-gray-700">{TEXT.labelRole}</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-gray-50/50">
                                                                <SelectValue placeholder={TEXT.placeholderRole} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Senior UI/UX Designer">{TEXT.roleDesigner}</SelectItem>
                                                            <SelectItem value="Frontend Engineer">{TEXT.roleFrontend}</SelectItem>
                                                            <SelectItem value="Backend Engineer">{TEXT.roleBackend}</SelectItem>
                                                            <SelectItem value="Product Manager">{TEXT.roleManager}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="contractType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-gray-700">{TEXT.labelContract}</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-gray-50/50">
                                                                <SelectValue placeholder={TEXT.placeholderContract} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="FULL_TIME">{TEXT.contractFullTime}</SelectItem>
                                                            <SelectItem value="PART_TIME">{TEXT.contractPartTime}</SelectItem>
                                                            <SelectItem value="CONTRACT">{TEXT.contractProbation}</SelectItem>
                                                            <SelectItem value="INTERN">{TEXT.contractIntern}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="lineManager"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-gray-700">{TEXT.managerLabel}</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-gray-50/50">
                                                                <SelectValue placeholder={TEXT.placeholderManager} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Michael Scott">Trần Anh Tuấn</SelectItem>
                                                            <SelectItem value="Dwight Schrute">Lê Hoàng Long</SelectItem>
                                                            <SelectItem value="Jim Halpert">Nguyễn Nhật Minh</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="startDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col pt-1">
                                                    <FormLabel className="font-bold text-gray-700">{TEXT.labelStartDate}</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-full pl-3 text-left font-normal bg-gray-50/50",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? format(field.value, "PPP") : <span>{TEXT.selectDate}</span>}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value || undefined}
                                                                onSelect={field.onChange}
                                                                defaultMonth={field.value || new Date()}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="endDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col pt-1">
                                                    <FormLabel className="font-bold text-gray-700">{TEXT.labelEndDate}</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-full pl-3 text-left font-normal bg-gray-50/50",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? format(field.value, "PPP") : <span>{TEXT.selectDate}</span>}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value || undefined}
                                                                onSelect={field.onChange}
                                                                defaultMonth={field.value || undefined}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">

                                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border shadow-sm h-min">
                                    <h3 className="text-lg font-bold mb-4 border-b pb-4">{TEXT.sectionDocs}</h3>

                                    <div className="space-y-4">
                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center justify-between p-3 border rounded-xl bg-gray-50/50 hover:border-primary/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">HopDongLaoDong.pdf</p>
                                                        <p className="text-xs text-muted-foreground">{TEXT.fileSigned}</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="flex items-center justify-between p-3 border rounded-xl bg-gray-50/50 hover:border-primary/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                        <ImageIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">BanSaoCCCD.jpg</p>
                                                        <p className="text-xs text-muted-foreground">{TEXT.fileVerified}</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-bold mb-3 text-gray-700">{TEXT.labelUploadNew}</h4>
                                            <div
                                                className={cn(
                                                    "border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer relative",
                                                    dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                                                )}
                                                onDragEnter={handleDrag}
                                                onDragLeave={handleDrag}
                                                onDragOver={handleDrag}
                                                onDrop={handleDrop}
                                            >
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={handleFileInput}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <UploadCloud className="w-8 h-8 text-primary/60 mx-auto mb-3" />
                                                <p className="text-sm font-bold text-gray-700">
                                                    {TEXT.dragDrop}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {TEXT.orBrowse}
                                                </p>
                                                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-1">
                                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{TEXT.allowedFormats}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{TEXT.maxSize}</span>
                                                </div>
                                            </div>

                                            {files.length > 0 && (
                                                <div className="mt-4 space-y-2">
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{TEXT.readyUploadPrefix}{files.length}{TEXT.readyUploadSuffix}</p>
                                                    {files.map((file, i) => (
                                                        <div key={i} className="flex items-center justify-between p-2.5 border rounded-lg bg-gray-50 animate-in fade-in slide-in-from-bottom-2">
                                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                                {file.type.includes("pdf") ? (
                                                                    <FileText className="w-4 h-4 text-red-500 shrink-0" />
                                                                ) : (
                                                                    <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                                                                )}
                                                                <div className="truncate">
                                                                    <p className="text-xs font-semibold text-gray-700 truncate">{file.name}</p>
                                                                    <p className="text-[10px] text-gray-400">{(file.size / 1024 / 1024).toFixed(2)}{TEXT.mbText}</p>
                                                                </div>
                                                            </div>
                                                            <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors shrink-0">
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border shadow-sm">
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">{TEXT.statsTitle}</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="border bg-purple-50/50 dark:bg-purple-900/10 rounded-xl p-4 text-center">
                                            <p className="text-3xl font-black text-purple-600 mb-1">12</p>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">{TEXT.statsLeaveLabel}</p>
                                        </div>
                                        <div className="border bg-teal-50/50 dark:bg-teal-900/10 rounded-xl p-4 text-center">
                                            <p className="text-3xl font-black text-teal-600 mb-1">98<span className="text-xl">{TEXT.percentSign}</span></p>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">{TEXT.statsAttendanceLabel}</p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </form>
                    </Form>

                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

import { z } from "zod";
import { AssetStatus } from "@/services/assetService";

export const assetSchema = z
  .object({
    name: z
      .string()
      .min(3, "Tên tài sản phải có ít nhất 3 ký tự")
      .max(100, "Tên tài sản quá dài"),
    type: z.string().min(1, "Vui lòng chọn hoặc nhập loại tài sản"),
    value: z.coerce.number().min(0, "Giá trị không được âm").optional(),
    purchaseDate: z
      .string()
      .optional()
      .refine((date) => {
        if (!date) {
          return true;
        }
        return new Date(date) <= new Date();
      }, "Ngày mua không được trong tương lai"),
    condition: z.string().min(1, "Vui lòng chọn tình trạng tài sản"),
    locationOrUser: z.string().optional(),
    warrantyDate: z.string().optional(),
    supplier: z.string().optional(),
    contractDate: z.string().optional(),
    contractNumber: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    initialStatus: z.custom<AssetStatus>().optional(),
  })
  .refine(
    (data) => {
      if (data.purchaseDate && data.warrantyDate) {
        return new Date(data.warrantyDate) >= new Date(data.purchaseDate);
      }
      return true;
    },
    {
      message: "Ngày bảo hành phải sau ngày mua",
      path: ["warrantyDate"],
    },
  )
  .refine(
    (data) => {
      if (data.purchaseDate && data.contractDate) {
        return new Date(data.contractDate) >= new Date(data.purchaseDate);
      }
      return true;
    },
    {
      message: "Ngày hợp đồng phải sau ngày mua",
      path: ["contractDate"],
    },
  );

export type AssetSchemaType = z.infer<typeof assetSchema>;

"use client"

import { X, Calendar, SlidersHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SYSTEM_MESSAGES } from "@/constants/messages"

export type Asset = {
  id: string
  code: string
  name: string
  type: string
  assignedTo: string
  assignedDate: string
  status: "new" | "normal" | "maintenance"
  image?: string
  warrantyUntil?: string
  supplier?: string
  contractNum?: string
}

interface Props {
  asset: Asset | null
  open: boolean
  onClose: () => void
}

const PLACEHOLDERS = {
  WARRANTY: "05/03/2026 14:30",
  SUPPLIER: "FPT Retail",
  CONTRACT: "HD-2023-084",
} as const

export function AssetDetailSheet({ asset, open, onClose }: Props) {
  if (!asset) {return null}

  const renderStatus = () => {
    switch (asset.status) {
      case "new":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            {SYSTEM_MESSAGES.ASSET_DETAIL.STATUS_NEW}
          </Badge>
        )
      case "normal":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            {SYSTEM_MESSAGES.ASSET_DETAIL.STATUS_NORMAL}
          </Badge>
        )
      case "maintenance":
        return (
          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
            {SYSTEM_MESSAGES.ASSET_DETAIL.STATUS_MAINTENANCE}
          </Badge>
        )
    }
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? "visible" : "invisible"}`}>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"
          }`}
      />

      {/* Drawer */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl 
        transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{SYSTEM_MESSAGES.ASSET_DETAIL.TITLE}</h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto h-[calc(100%-64px)]">
          {/* Image */}
          <div className="p-6">
            <div className="rounded-2xl overflow-hidden bg-teal-600">
              <img
                src={
                  asset.image ||
                  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8"
                }
                alt={asset.name}
                className="w-full h-48 object-cover"
              />
            </div>
          </div>

          {/* Title Section */}
          <div className="px-6 pb-6 border-b space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-red-600 uppercase">
                {asset.type}
              </span>
              {renderStatus()}
            </div>

            <h3 className="text-xl font-semibold">{asset.name}</h3>
            <p className="text-sm text-muted-foreground">{asset.code}</p>
          </div>

          {/* User + Date cards */}
          <div className="grid grid-cols-2 gap-4 p-6">
            <div className="border rounded-xl p-4 space-y-3">
              <p className="text-xs text-muted-foreground uppercase">
                {SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_USER}
              </p>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {asset.assignedTo.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{asset.assignedTo}</span>
              </div>
            </div>

            <div className="border rounded-xl p-4 space-y-3">
              <p className="text-xs text-muted-foreground uppercase">
                {SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_ASSIGNED_DATE}
              </p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {asset.assignedDate}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="px-6 pb-10 space-y-6">
            <div className="flex items-center gap-2 font-semibold">
              <SlidersHorizontal className="w-4 h-4 text-red-500" />
              {SYSTEM_MESSAGES.ASSET_DETAIL.SECTION_BASIC}
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-3">
                <span className="text-muted-foreground">{SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_TYPE}</span>
                <span>{SYSTEM_MESSAGES.ASSET_DETAIL.TYPE_TECH}</span>
              </div>

              <div className="flex justify-between border-b pb-3">
                <span className="text-muted-foreground">{SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_CONDITION}</span>
                <span>{SYSTEM_MESSAGES.STATUS.GOOD}</span>
              </div>

              <div className="flex justify-between border-b pb-3">
                <span className="text-muted-foreground">{SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_WARRANTY}</span>
                <span>{asset.warrantyUntil || PLACEHOLDERS.WARRANTY}</span>
              </div>

              <div className="flex justify-between border-b pb-3">
                <span className="text-muted-foreground">{SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_SUPPLIER}</span>
                <span>{asset.supplier || PLACEHOLDERS.SUPPLIER}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">{SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_CONTRACT}</span>
                <span>{asset.contractNum || PLACEHOLDERS.CONTRACT}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

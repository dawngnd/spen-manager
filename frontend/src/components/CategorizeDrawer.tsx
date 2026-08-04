import { useGetCategories } from "@/hooks/useCategories"
import { useCategorizeTransaction } from "@/hooks/useTransactions"
import { Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import type { ChangeEvent } from "react"
import { createPortal } from "react-dom"

interface CategorizeDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionId: string | null
}

export function CategorizeDrawer({
  open,
  onOpenChange,
  transactionId,
}: CategorizeDrawerProps) {
  const { data: response, isLoading: isLoadingCategories } = useGetCategories()
  const categories = response?.data || []
  
  const categorizeMutation = useCategorizeTransaction()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedParent, setSelectedParent] = useState('')
  const [selectedChild, setSelectedChild] = useState('')

  // Reset state when reopening
  useEffect(() => {
    if (open) {
      setSuccess(false)
      setError(null)
      setSelectedParent('')
      setSelectedChild('')
    }
  }, [open])

  const parentCategories = categories.filter((c: any) => !c.parent_id)
  const childCategories = categories.filter((c: any) => c.parent_id)
  const currentChildren = childCategories.filter((c: any) => c.parent_id === selectedParent)

  const handleSelectCategory = (parentId: string, childId: string) => {
    setError(null)
    console.log('[categorize] click', { transactionId, parentId, childId })
    if (!transactionId) {
      setError('Không tìm thấy transactionId (ID giao dịch trống)')
      return
    }
    categorizeMutation.mutate(
      { transaction_id: transactionId, category_parent_id: parentId, category_child_id: childId },
      {
        onSuccess: (response) => {
          console.log('[categorize] success', response)
          if (!response.success) {
            setError('Lỗi từ Server: ' + (response.error || 'unknown'))
            return;
          }
          setSuccess(true)
          setTimeout(() => {
            setSuccess(false)
            onOpenChange(false)
          }, 1000)
        },
        onError: (error) => {
          console.error('[categorize] error', error)
          setError('Lỗi API: ' + ((error as any)?.message || 'unknown'))
        },
      }
    )
  }

  const onParentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedParent(val)
    setSelectedChild('')
    // Nếu parent không có con, tự categorize với chính parent
    const parentHasChildren = childCategories.some((c: any) => c.parent_id === val)
    if (val && !parentHasChildren) {
      handleSelectCategory(val, val)
    }
  }

  const onChildChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedChild(val)
    if (selectedParent && val) {
      handleSelectCategory(selectedParent, val)
    }
  }

  if (!open) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-[99] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => onOpenChange(false)}
      />

      {/* Form Container */}
      <div
        className={`fixed bottom-0 left-0 right-0 max-h-[85vh] bg-background border-t rounded-t-[10px] z-[100] transition-transform duration-300 transform shadow-2xl overflow-hidden flex flex-col ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted cursor-pointer shrink-0" onClick={() => onOpenChange(false)} />
        
        <div className="grid gap-1.5 p-4 text-center sm:text-left shrink-0">
          <h2 className="text-lg font-semibold leading-none tracking-tight">Chọn danh mục</h2>
        </div>
        
        <div className="overflow-y-auto p-4 space-y-6 flex-1">
          {error && (
            <div className="shrink-0 p-3 rounded-lg border border-red-500/50 bg-red-500/10 text-red-500 text-sm font-medium">
              {error}
            </div>
          )}
          {isLoadingCategories ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : success ? (
            <div className="flex justify-center p-8 text-green-500 font-medium">
              Đã cập nhật danh mục!
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              {categorizeMutation.isPending && (
                <div className="shrink-0 flex items-center justify-center gap-2 p-2 text-muted-foreground text-sm font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu...
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground" htmlFor="cat-parent">
                    Danh mục cha
                  </label>
                  <select
                    id="cat-parent"
                    value={selectedParent}
                    onChange={onParentChange}
                    disabled={categorizeMutation.isPending}
                    className="w-full p-3 text-sm rounded-lg border bg-card text-card-foreground focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {parentCategories.map((parent: any) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.icon} {parent.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedParent && currentChildren.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground" htmlFor="cat-child">
                      Danh mục con
                    </label>
                    <select
                      id="cat-child"
                      value={selectedChild}
                      onChange={onChildChange}
                      disabled={categorizeMutation.isPending}
                      className="w-full p-3 text-sm rounded-lg border bg-card text-card-foreground focus:outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">-- Chọn danh mục con --</option>
                      {currentChildren.map((child: any) => (
                        <option key={child.id} value={child.id}>
                          {child.icon} {child.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}

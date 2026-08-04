import { useGetCategories } from "@/hooks/useCategories"
import { useCategorizeTransaction } from "@/hooks/useTransactions"
import { Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
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

  // Reset success state when reopening
  useEffect(() => {
    if (open) {
      setSuccess(false)
      setError(null)
    }
  }, [open])

  const parentCategories = categories.filter((c: any) => !c.parent_id)
  const childCategories = categories.filter((c: any) => c.parent_id)

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
              {parentCategories.map((parent: any) => (
                <div key={parent.id} className="space-y-2">
                  <div className="font-medium text-sm text-muted-foreground px-2 flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: parent.color }}
                    />
                    {parent.icon} {parent.name}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {childCategories
                      .filter((c: any) => c.parent_id === parent.id)
                      .map((child: any) => (
                      <div
                          key={child.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (categorizeMutation.isPending) return
                            handleSelectCategory(parent.id, child.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              if (categorizeMutation.isPending) return
                              handleSelectCategory(parent.id, child.id);
                            }
                          }}
                          aria-disabled={categorizeMutation.isPending}
                          className={`flex items-center gap-2 p-3 text-sm rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground transition-colors cursor-pointer select-none ${
                            categorizeMutation.isPending ? 'opacity-50' : ''
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: child.color }}
                          />
                          <span className="text-base shrink-0">{child.icon}</span>
                          <span className="truncate">{child.name}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}

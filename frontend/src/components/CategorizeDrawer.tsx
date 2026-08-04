import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useGetCategories } from "@/hooks/useCategories"
import { useCategorizeTransaction } from "@/hooks/useTransactions"
import { Loader2 } from "lucide-react"
import { useState } from "react"

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

  const parentCategories = categories.filter((c: any) => !c.parent_id)
  const childCategories = categories.filter((c: any) => c.parent_id)

  const handleSelectCategory = (parentId: string, childId: string) => {
    console.log('[categorize] click', { transactionId, parentId, childId })
    if (!transactionId) return
    categorizeMutation.mutate(
      { transaction_id: transactionId, category_parent_id: parentId, category_child_id: childId },
      {
        onSuccess: (response) => {
          console.log('[categorize] success', response)
          setSuccess(true)
          setTimeout(() => {
            setSuccess(false)
            onOpenChange(false)
          }, 1000)
        },
        onError: (error) => {
          console.error('[categorize] error', error)
        },
      }
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Chọn danh mục</DrawerTitle>
        </DrawerHeader>
        
        <div className="overflow-y-auto p-4 space-y-6" data-vaul-no-drag>
          {isLoadingCategories ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : success ? (
            <div className="flex justify-center p-8 text-green-500 font-medium">
              Đã cập nhật danh mục!
            </div>
          ) : (
            <div className="space-y-6">
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
                        <button
                          key={child.id}
                          onClick={() => handleSelectCategory(parent.id, child.id)}
                          disabled={categorizeMutation.isPending}
                          className="flex items-center gap-2 p-3 text-sm rounded-lg border bg-card text-card-foreground shadow-sm active:bg-accent active:text-accent-foreground transition-colors disabled:opacity-50 text-left"
                        >
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: child.color }}
                          />
                          <span className="text-base">{child.icon}</span>
                          <span className="truncate">{child.name}</span>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

import { useState } from "react"
import { useGetCategories, useUpsertCategory, useDeleteCategory } from "@/hooks/useCategories"
import type { Category } from "@/lib/api"
import { Plus, Edit2, Trash2, Loader2, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function Categories() {
  const { data: response, isLoading, refetch, isFetching } = useGetCategories()
  const categories = response?.data || []
  
  const upsertMutation = useUpsertCategory()
  const deleteMutation = useDeleteCategory()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  // Form state
  const [name, setName] = useState("")
  const [icon, setIcon] = useState("")
  const [color, setColor] = useState("#000000")
  const [parentId, setParentId] = useState("")

  const parentCategories = categories.filter((c: any) => !c.parent_id)
  const childCategories = categories.filter((c: any) => c.parent_id)

  const openDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setName(category.name)
      setIcon(category.icon)
      setColor(category.color)
      setParentId(category.parent_id || "")
    } else {
      setEditingCategory(null)
      setName("")
      setIcon("📦")
      setColor("#3b82f6")
      setParentId("")
    }
    setDialogOpen(true)
  }

  const handleSave = () => {
    upsertMutation.mutate(
      {
        action: 'upsert_category',
        id: editingCategory?.id,
        name,
        icon,
        color,
        parent_id: parentId || undefined,
      },
      {
        onSuccess: () => {
          setDialogOpen(false)
        },
      }
    )
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-4 pb-24 relative overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          title="Reload categories"
        >
          <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No categories found.
        </div>
      ) : (
        <div className="space-y-6">
          {parentCategories.map((parent: any) => (
            <div key={parent.id} className="space-y-3">
              <div className="flex items-center justify-between bg-card border rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: parent.color }}
                  />
                  <span className="text-xl">{parent.icon}</span>
                  <span className="font-semibold">{parent.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openDialog(parent)}
                    className="p-2 text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(parent.id)}
                    className="p-2 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pl-6 space-y-2">
                {childCategories
                  .filter((c: any) => c.parent_id === parent.id)
                  .map((child: any) => (
                    <div key={child.id} className="flex items-center justify-between bg-card/50 border rounded-lg p-2 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: child.color }}
                        />
                        <span className="text-lg">{child.icon}</span>
                        <span>{child.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => openDialog(child)}
                          className="p-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(child.id)}
                          className="p-1.5 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => openDialog()}
        className="fixed bottom-20 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 p-1 cursor-pointer"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="parent">Parent Category (Optional)</Label>
              <select
                id="parent"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">None (Top Level)</option>
                {parentCategories
                  .filter((c: any) => c.id !== editingCategory?.id)
                  .map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.icon} {p.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={handleSave}
              disabled={upsertMutation.isPending || !name || !icon}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              {upsertMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

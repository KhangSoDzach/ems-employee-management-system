import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-secondary/30">
      <h1 className="text-3xl font-bold text-primary">EMS Base Project 🚀</h1>
      <p className="text-muted-foreground">Setup thành công: Vite + React 19 + Tailwind v4</p>
      
      <div className="flex gap-4">
        <Button variant="primary">Nút Primary</Button>
        <Button variant="destructive">Nút Xóa</Button>
        <Button variant="outline" isLoading>Đang tải...</Button>
      </div>
    </div>
  )
}

export default App
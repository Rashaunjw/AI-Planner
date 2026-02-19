import { GraduationCap } from "lucide-react"

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <GraduationCap className="h-12 w-12 text-indigo-400 mx-auto mb-3 animate-pulse" />
        <p className="text-indigo-600 font-medium">{message}</p>
      </div>
    </div>
  )
}


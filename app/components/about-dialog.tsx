"use client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AboutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-600">school</span>
            About GradeIT
          </DialogTitle>
          <DialogDescription>Your Academic Progress Tracker</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* App Info */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full mb-4">
              <span className="material-symbols-outlined text-2xl text-white">school</span>
            </div>
            <h3 className="text-lg font-semibold">GradeIT v2.0</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              A comprehensive academic tracking application for students
            </p>
          </div>

          {/* Developer Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">person</span>
              Developer
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Kevin Tandon</strong>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Engineering Student passionate about building tools that help students succeed
            </p>
          </div>

          {/* Features */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">star</span>
              Features
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Track attendance across subjects</li>
              <li>• Monitor exam marks and GPA</li>
              <li>• Visual analytics and trends</li>
              <li>• PDF report generation</li>
              <li>• Goal setting and progress tracking</li>
            </ul>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.open("https://github.com/kev0-4/GradeIT", "_blank")}
            >
              <span className="material-symbols-outlined mr-2 text-sm">code</span>
              View on GitHub
            </Button>

            <Button
              className="w-full justify-start bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
              onClick={() => window.open("https://buymeacoffee.com/kevintandon", "_blank")}
            >
              <span className="material-symbols-outlined mr-2 text-sm">favorite</span>
              Support the Developer
            </Button>
          </div>

          {/* Version Info */}
          <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Made with ❤️ for students everywhere</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">© 2024 Kevin Tandon. All rights reserved.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

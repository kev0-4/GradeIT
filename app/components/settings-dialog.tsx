"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/app/contexts/auth-context"
import { getUserSettings, updateUserSettings, type AppSettings } from "@/app/utils/user-data"
import { toast } from "sonner"
import { Target, TrendingUp, Award, Save, X } from "lucide-react"
import { ThemeToggle } from "@/app/components/theme-toggle"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { user } = useAuth()
  const [attendanceGoal, setAttendanceGoal] = useState<number | string>("75")
  const [gpaGoal, setGpaGoal] = useState<number | string>("8.0")
  const [marksPerCredit, setMarksPerCredit] = useState<number | string>("25")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && user) {
      const fetchSettings = async () => {
        setIsLoading(true)
        try {
          const settings = await getUserSettings(user)
          if (settings) {
            setAttendanceGoal(settings.attendanceGoal.toString())
            setGpaGoal(settings.gpaGoal.toString())
            setMarksPerCredit(settings.marksPerCredit.toString())
          } else {
            setAttendanceGoal("75")
            setGpaGoal("8.0")
            setMarksPerCredit("25")
          }
        } catch (error) {
          console.error("Failed to fetch settings:", error)
          toast.error("Could not load your settings.")
          setAttendanceGoal("75")
          setGpaGoal("8.0")
          setMarksPerCredit("25")
        } finally {
          setIsLoading(false)
        }
      }
      fetchSettings()
    }
  }, [open, user])

  const handleSave = async () => {
    if (!user) {
      toast.error("You must be logged in to save settings.")
      return
    }

    setIsLoading(true)

    const parsedAttendanceGoal = Number.parseFloat(attendanceGoal as string)
    const parsedGpaGoal = Number.parseFloat(gpaGoal as string)
    const parsedMarksPerCredit = Number.parseInt(marksPerCredit as string, 10)

    if (isNaN(parsedAttendanceGoal) || parsedAttendanceGoal <= 0 || parsedAttendanceGoal > 100) {
      toast.error("Please enter a valid attendance goal (1-100).")
      setIsLoading(false)
      return
    }
    if (isNaN(parsedGpaGoal) || parsedGpaGoal <= 0 || parsedGpaGoal > 10) {
      toast.error("Please enter a valid GPA goal (e.g., 1-10).")
      setIsLoading(false)
      return
    }
    if (isNaN(parsedMarksPerCredit) || parsedMarksPerCredit <= 0) {
      toast.error("Please enter a valid number for marks per credit.")
      setIsLoading(false)
      return
    }

    const newSettings: AppSettings = {
      attendanceGoal: parsedAttendanceGoal,
      gpaGoal: parsedGpaGoal,
      marksPerCredit: parsedMarksPerCredit,
    }

    try {
      await updateUserSettings(user, newSettings)
      toast.success("Settings saved successfully!")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast.error("Failed to save settings. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            Application Settings
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Customize your academic goals and preferences to personalize your experience.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          <Card className="border-0 shadow-none bg-muted/30">
            <CardContent className="p-6 space-y-6">
              {/* Attendance Goal */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="attendanceGoal" className="text-base font-medium">
                      Attendance Goal
                    </Label>
                    <p className="text-sm text-muted-foreground">Target percentage for class attendance</p>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    id="attendanceGoal"
                    type="number"
                    value={attendanceGoal}
                    onChange={(e) => setAttendanceGoal(e.target.value)}
                    className="pl-4 pr-12 h-12 text-lg font-medium"
                    placeholder="75"
                    min="1"
                    max="100"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
                </div>
              </div>

              <Separator />

              {/* GPA Goal */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="gpaGoal" className="text-base font-medium">
                      GPA Goal
                    </Label>
                    <p className="text-sm text-muted-foreground">Target grade point average (0-10 scale)</p>
                  </div>
                </div>
                <Input
                  id="gpaGoal"
                  type="number"
                  step="0.1"
                  value={gpaGoal}
                  onChange={(e) => setGpaGoal(e.target.value)}
                  className="h-12 text-lg font-medium"
                  placeholder="8.0"
                  min="0"
                  max="10"
                />
              </div>

              <Separator />

              {/* Marks per Credit */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="marksPerCredit" className="text-base font-medium">
                      Marks per Credit
                    </Label>
                    <p className="text-sm text-muted-foreground">Expected marks for each credit hour</p>
                  </div>
                </div>
                <Input
                  id="marksPerCredit"
                  type="number"
                  value={marksPerCredit}
                  onChange={(e) => setMarksPerCredit(e.target.value)}
                  className="h-12 text-lg font-medium"
                  placeholder="25"
                  min="1"
                />
              </div>

              <Separator />

              {/* Theme Settings */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">palette</span>
                  </div>
                  <div className="flex-1">
                    <Label className="text-base font-medium">Theme Preference</Label>
                    <p className="text-sm text-muted-foreground">Choose your preferred display theme</p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="px-6 py-4 bg-muted/20 border-t">
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none h-11"
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 sm:flex-none h-11" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

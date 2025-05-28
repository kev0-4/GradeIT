"use client";

import { useState } from "react";
import { useAuth } from "../contexts/auth-context";
import { Button } from "@/components/ui/button";
import SettingsDialog from "./settings-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AboutDialog from "./about-dialog";

export default function UserProfile() {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={user.photoURL || ""}
                alt={user.displayName || "User"}
              />
              <AvatarFallback className="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
                {getInitials(user.displayName || user.email || "U")}
              </AvatarFallback>
            </Avatar>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={user.photoURL || ""}
                  alt={user.displayName || "User"}
                />
                <AvatarFallback className="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
                  {getInitials(user.displayName || user.email || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.displayName || "User"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="material-symbols-outlined text-sm mr-2">
                    verified_user
                  </span>
                  Account verified
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="material-symbols-outlined text-sm mr-2">
                    cloud_sync
                  </span>
                  Data synced
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
              <Button
                onClick={() => setShowSettingsDialog(true)}
                variant="ghost"
                className="w-full justify-start"
              >
                <span className="material-symbols-outlined text-sm mr-2">
                  settings
                </span>
                Settings
              </Button>
              <Button
                onClick={() => setShowAbout(true)}
                variant="ghost"
                className="w-full justify-start"
              >
                <span className="material-symbols-outlined text-sm mr-2">
                  info
                </span>
                About GradeIT
              </Button>

              <Button
                onClick={handleSignOut}
                disabled={isSigningOut}
                variant="outline"
                className="w-full"
              >
                {isSigningOut ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Signing out...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-sm mr-2">
                      logout
                    </span>
                    Sign out
                  </div>
                )}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <AboutDialog open={showAbout} onOpenChange={setShowAbout} />
      <SettingsDialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog} />
    </>
  );
}

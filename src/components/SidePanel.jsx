import { useEffect, useState } from "react"
import { Menu } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import SidebarHeader from "./sidebar/SidebarHeader"
import SidebarContent from "./sidebar/SidebarContent"
import SidebarRail from "./sidebar/SidebarRail"
import SidebarFooter from "./sidebar/SidebarFooter"

export default function SidePanel({
  avatar,
  onAvatarChange,
  personalidade,
  onPersonalidadeChange,
  armAngle,
  onArmAngleChange,
  background,
  onBackgroundChange,
  nomeUsuario,
  onNomeUsuarioChange,
  lipSyncIntensity,
  onLipSyncIntensityChange,
  panelTheme,
  onPanelThemeChange,
  animation,
  onAnimationChange,
  dark,
  onToggleDark,
}) {

  const [expanded, setExpanded] = useState(false)
  const [open, setOpen] = useState(false)


  useEffect(() => {
    localStorage.setItem(
      "companion-config",
      JSON.stringify({ avatar, personalidade, armAngle, lipSyncIntensity, panelTheme })
    )
  }, [avatar, personalidade, armAngle, lipSyncIntensity, panelTheme])

  return (
    <TooltipProvider delayDuration={200}>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="fixed left-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg sm:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 sm:hidden"
        />
      )}

      <aside
        className={cn(
          "sidebar-glass fixed left-0 top-0 z-30 flex h-full flex-col border-r border-sidebar-border transition-all duration-300 ease-in-out",
          `panel-theme-${panelTheme}`,
          open ? "translate-x-0 w-[85vw] max-w-72" : "-translate-x-full",
          "sm:translate-x-0",
          expanded ? "sm:w-72" : "sm:w-16"
        )}
      >
        <SidebarHeader expanded={expanded || open} />

        {expanded || open ? (
          <SidebarContent
            avatar={avatar}
            onAvatarChange={onAvatarChange}
            personalidade={personalidade}
            onPersonalidadeChange={onPersonalidadeChange}
            armAngle={armAngle}
            onArmAngleChange={onArmAngleChange}
            background={background}
            onBackgroundChange={onBackgroundChange}
            nomeUsuario={nomeUsuario}
            onNomeUsuarioChange={onNomeUsuarioChange}
            lipSyncIntensity={lipSyncIntensity}
            onLipSyncIntensityChange={onLipSyncIntensityChange}
            panelTheme={panelTheme}
            onPanelThemeChange={onPanelThemeChange}
            animation={animation}
            onAnimationChange={onAnimationChange}
          />
        ) : (
          <SidebarRail
            avatar={avatar}
            personalidade={personalidade}
            armAngle={armAngle}
            onExpand={() => setExpanded(true)}
          />
        )}

        <SidebarFooter
          expanded={expanded}
          open={open}
          onToggle={() => setExpanded((v) => !v)}
          onClose={() => setOpen(false)}
          dark={dark}
          onToggleDark={onToggleDark}
        />
      </aside>
    </TooltipProvider>
  )
}

// GraphSettings.jsx
import { useState } from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandCircleDownIcon from "@mui/icons-material/ExpandCircleDown";
import FaceIcon from "@mui/icons-material/Face";
import LocationOnIcon from "@mui/icons-material/LocationOn";

function SettingsExpandContainer({
  setCollapseFlagParent,
  changing_default_display_company_parent,
  onEdgeFilterChange,
}) {
  const [view, setView] = useState("medium");
  const [type, setType] = useState("all");
  const [highlightPath, setHighlightPath] = useState(true); // purely local, frontend-only

  return (
    <div className="w-full absolute bottom-0 left-0 z-40 flex justify-center pb-2">
      <div
        className="
          max-w-xl w-[95%] md:w-[480px]
          bg-white/90
          rounded-t-2xl
          border border-slate-200
          shadow-[0_-12px_30px_rgba(15,23,42,0.18)]
          backdrop-blur-xl
          !px-4 !py-3
          relative
        "
      >
        {/* Collapse Button */}
        <button
          onClick={() => setCollapseFlagParent(false)}
          type="button"
          className="
            flex items-center justify-center
            absolute
            -top-4
            right-4
            h-8 w-8
            rounded-full
            bg-white
            shadow-md
            border border-slate-200
            hover:shadow-lg hover:-translate-y-0.5
            transition-all duration-200
          "
        >
          <ExpandCircleDownIcon className="!text-[26px] text-slate-600" />
        </button>

        <div className="grid grid-cols-[40%_60%] gap-x-3 text-sm text-slate-700">
          {/* Left labels */}
          <div className="flex flex-col gap-3 pr-1">
            <div className="flex items-center h-10 text-xs md:text-sm font-medium text-slate-600 border-b border-slate-200">
              View of Company
            </div>
            <div className="flex items-center h-10 text-xs md:text-sm font-medium text-slate-600 border-b border-slate-200">
              Type of Connection
            </div>
            <div className="flex items-center h-10 text-xs md:text-sm font-medium text-slate-600">
              Path Highlight
            </div>
          </div>

          {/* Right controls */}
          <div className="flex flex-col gap-3 pl-1">
            {/* View of Company */}
            <div className="flex items-center h-10 gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setView("minimal");
                  changing_default_display_company_parent(
                    "minimal_company_display"
                  );
                }}
                className={`
                  flex-1 h-9 rounded-xl text-xs md:text-sm font-medium
                  border transition-all duration-200
                  ${
                    view === "minimal"
                      ? "bg-indigo-50 border-indigo-400 text-indigo-600 shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }
                `}
              >
                Minimal
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("medium");
                  changing_default_display_company_parent(
                    "default_company_display"
                  );
                }}
                className={`
                  flex-1 h-9 rounded-xl text-xs md:text-sm font-medium
                  border transition-all duration-200
                  ${
                    view === "medium"
                      ? "bg-indigo-50 border-indigo-400 text-indigo-600 shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }
                `}
              >
                Medium
              </button>
            </div>

            {/* Type of Connection */}
            <div className="flex items-center h-10 gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setType("all");
                  onEdgeFilterChange("all");
                }}
                className={`
                  flex-1 h-9 rounded-xl text-xs md:text-sm font-medium
                  border transition-all duration-200
                  ${
                    type === "all"
                      ? "bg-indigo-50 border-indigo-400 text-indigo-600 shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }
                `}
              >
                ALL
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("person");
                  onEdgeFilterChange("person");
                }}
                className={`
                  flex-1 h-9 rounded-xl border transition-all duration-200
                  flex items-center justify-center gap-1 text-xs md:text-sm
                  ${
                    type === "person"
                      ? "bg-indigo-50 border-indigo-400 text-indigo-600 shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }
                `}
              >
                <FaceIcon className="!text-[18px]" />
                <span className="hidden sm:inline">Person</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("location");
                  onEdgeFilterChange("location");
                }}
                className={`
                  flex-1 h-9 rounded-xl border transition-all duration-200
                  flex items-center justify-center gap-1 text-xs md:text-sm
                  ${
                    type === "location"
                      ? "bg-indigo-50 border-indigo-400 text-indigo-600 shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }
                `}
              >
                <LocationOnIcon className="!text-[18px]" />
                <span className="hidden sm:inline">Location</span>
              </button>
            </div>

            {/* Path Highlight – purely visual toggle, no external dependency */}
            <div className="flex items-center h-10 justify-between">
              <span className="text-xs md:text-sm text-slate-600">
                Highlight path to root
              </span>
              <button
                type="button"
                onClick={() => setHighlightPath((prev) => !prev)}
                className={`
                  inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200
                  ${
                    highlightPath
                      ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                      : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                  }
                `}
              >
                {highlightPath ? "On" : "Off"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsButton({
  open,
  changing_default_company_display_tape_f,
  onEdgeFilterChange,
}) {
  const [openFlag, setOpenFlag] = useState(open);

  return (
    <>
      {openFlag ? (
        <SettingsExpandContainer
          setCollapseFlagParent={setOpenFlag}
          changing_default_display_company_parent={
            changing_default_company_display_tape_f
          }
          onEdgeFilterChange={onEdgeFilterChange}
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpenFlag(true)}
          className="
            h-10 !px-4
            absolute
            bottom-0
            left-1/2
            -translate-x-1/2
            z-30
            bg-gradient-to-br from-indigo-500 to-purple-500
            rounded-t-2xl
            border border-indigo-400/70
            flex items-center justify-center gap-2
            text-white text-sm font-medium
            shadow-[0_-6px_18px_rgba(79,70,229,0.45)]
            hover:from-purple-500 hover:to-indigo-500
            transition-all duration-200
          "
        >
          <SettingsIcon className="!text-white !text-[18px]" />
          <span>Graph Settings</span>
        </button>
      )}
    </>
  );
}

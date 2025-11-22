import SettingsIcon from '@mui/icons-material/Settings';
import { useState } from 'react';
import ExpandCircleDownIcon from '@mui/icons-material/ExpandCircleDown';







function SettingsExpandContainer({setCollapseFlagParent, changing_default_display_company_parent}) {
  return (
    <>
      <div className='
            
h-30 w-full
absolute 
bottom-0 
z-40


flex
justify-center
'>


        {/* THE SETTINGS ITSELF */}
        <div className='
bg-blue-200/20
w-170
h-full
rounded-t-xl

backdrop-blur-xl 
border border-black/30 
flex
justify-center
items-center
gap-5




                '>
          <button
            onClick={() => { setCollapseFlagParent(false) }}
            /* THE SETTINGS ITSELF */
            type="button"
            className="
    flex items-center justify-center
    absolute
    left-0
    top-0
    h-6 w-6
    rounded-full
    bg-white
    shadow-md
    transition-shadow transition-transform duration-200
    hover:shadow-xl hover:shadow-black/40
    hover:-translate-y-0.5
  "
          >
            <ExpandCircleDownIcon className="!text-[32px]" />
          </button>

          <div className='
h-full 

w-1/4
bg-white/50
               '>

            <div
              onClick={() => { changing_default_display_company_parent("minimal_company_display") }}
              className='
bg-white
border
h-10 
w-full
bg-black
rounded-xl
hover:bg-black/30
flex
justify-center
items-center
text-black
'>
              Minimal
            </div>
            <div
              onClick={() => { changing_default_display_company_parent("default_company_display") }}
              className='
bg-white
border
h-10 
w-full
bg-black
rounded-xl
hover:bg-black/30
flex
justify-center
items-center
text-black
'>
              Medium
            </div>
            <div
              onClick={() => { changing_default_display_company_parent("default_company_display") }}
              className='
bg-white
border
h-10 
w-full
bg-black
rounded-xl
hover:bg-black/30
flex
justify-center
items-center
text-black
'>
              Detailed
            </div>


          </div>
          <div className='
h-full 

w-1/4
bg-white/50
               '>

          </div>
          <div className='
h-full 

w-1/4
bg-white/50


               '>

          </div>

        </div>
      </div>


    </>
  )
}












export default function SettingsButton({ open, changing_default_company_display_tape_f }) {
  const [openFlag, setOpenFlag] = useState(open)

  // console.log("IN THE OPEN FLAG", openFlag)

  return (
    <>


      {/* THE SETTINGS WARPPER AND CONTAINER */}
      {openFlag ?
        <SettingsExpandContainer setCollapseFlagParent={setOpenFlag} changing_default_display_company_parent={changing_default_company_display_tape_f}/>
        : <div

          onClick={() => { setOpenFlag(true) }}

          className="
h-10 w-30 
bg-black 
absolute 
bottom-0 
left-1/2 
z-30 
bg-gradient-to-br from-indigo-400 to-purple-500 
rounded-t-xl 
border
flex
justify-center
items-center
gap-2
text-white

hover:from-purple-400 hover:to-blue-500
                ">
          Settings
          <SettingsIcon className='!text-white' />
        </div>
      }

    </>
  )
}








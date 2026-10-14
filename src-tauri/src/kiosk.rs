// Kiosk Keyboard Security Guard
// Intercepts and suppresses Windows Key, Alt+Tab, and Ctrl+Esc on Windows machines

#[cfg(target_os = "windows")]
mod imp {
    use std::ptr::null_mut;
    use std::sync::atomic::{AtomicBool, Ordering};

    static HOOK_RUNNING: AtomicBool = AtomicBool::new(false);

    const WH_KEYBOARD_LL: i32 = 13;
    const HC_ACTION: i32 = 0;

    const VK_TAB: u32 = 0x09;
    const VK_ESCAPE: u32 = 0x1B;
    const VK_CONTROL: i32 = 0x11;
    const VK_LWIN: u32 = 0x5B;
    const VK_RWIN: u32 = 0x5C;
    const LLKHF_ALTDOWN: u32 = 0x20;

    #[repr(C)]
    struct KBDLLHOOKSTRUCT {
        vk_code: u32,
        scan_code: u32,
        flags: u32,
        time: u32,
        dw_extra_info: usize,
    }

    #[repr(C)]
    struct POINT {
        x: i32,
        y: i32,
    }

    #[repr(C)]
    struct MSG {
        hwnd: *mut std::ffi::c_void,
        message: u32,
        w_param: usize,
        l_param: isize,
        time: u32,
        pt: POINT,
    }

    type HookProc = unsafe extern "system" fn(code: i32, w_param: usize, l_param: isize) -> isize;

    #[link(name = "user32")]
    unsafe extern "system" {
        fn SetWindowsHookExW(
            id_hook: i32,
            lpfn: HookProc,
            h_mod: *mut std::ffi::c_void,
            dw_thread_id: u32,
        ) -> *mut std::ffi::c_void;
        fn CallNextHookEx(
            h_hk: *mut std::ffi::c_void,
            n_code: i32,
            w_param: usize,
            l_param: isize,
        ) -> isize;
        fn GetAsyncKeyState(v_key: i32) -> i16;
        fn GetMessageW(
            lp_msg: *mut MSG,
            h_wnd: *mut std::ffi::c_void,
            w_msg_filter_min: u32,
            w_msg_filter_max: u32,
        ) -> i32;
    }

    unsafe extern "system" fn low_level_keyboard_proc(
        n_code: i32,
        w_param: usize,
        l_param: isize,
    ) -> isize {
        if n_code == HC_ACTION && l_param != 0 {
            unsafe {
                let kbd = &*(l_param as *const KBDLLHOOKSTRUCT);

                // 1. Suppress Left & Right Windows keys
                if kbd.vk_code == VK_LWIN || kbd.vk_code == VK_RWIN {
                    return 1;
                }

                // 2. Suppress Alt + Tab
                if kbd.vk_code == VK_TAB && (kbd.flags & LLKHF_ALTDOWN != 0) {
                    return 1;
                }

                // 3. Suppress Alt + Escape
                if kbd.vk_code == VK_ESCAPE && (kbd.flags & LLKHF_ALTDOWN != 0) {
                    return 1;
                }

                // 4. Suppress Ctrl + Escape (opens Start Menu)
                if kbd.vk_code == VK_ESCAPE && (GetAsyncKeyState(VK_CONTROL) < 0) {
                    return 1;
                }
            }
        }

        unsafe { CallNextHookEx(null_mut(), n_code, w_param, l_param) }
    }

    pub fn init() {
        if HOOK_RUNNING.swap(true, Ordering::SeqCst) {
            return;
        }

        std::thread::spawn(|| {
            unsafe {
                let hook = SetWindowsHookExW(
                    WH_KEYBOARD_LL,
                    low_level_keyboard_proc,
                    null_mut(),
                    0,
                );

                if !hook.is_null() {
                    let mut msg: MSG = std::mem::zeroed();
                    while GetMessageW(&mut msg, null_mut(), 0, 0) > 0 {}
                }
            }
        });
    }
}

#[cfg(not(target_os = "windows"))]
mod imp {
    pub fn init() {
        // No-op on non-Windows platforms
    }
}

pub fn init() {
    imp::init();
}

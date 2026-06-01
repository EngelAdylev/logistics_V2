type NavigateFn = (to: string, options?: { replace?: boolean }) => void;

let _navigate: NavigateFn | null = null;

export function setNavigate(fn: NavigateFn) {
  _navigate = fn;
}

export function navigateTo(to: string) {
  if (_navigate) {
    _navigate(to, { replace: true });
  } else {
    window.location.href = to;
  }
}

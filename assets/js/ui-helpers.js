
const ERROR_MAP = {
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. please try again or reset it.',
    'auth/email-already-in-use': 'This email is already registered. Try signing in.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'permission-denied': 'You don\'t have permission to perform this action.',
    'unavailable': 'The service is temporarily unavailable. Please try again later.',
    'not-found': 'The requested data was not found.'
};

export function getFriendlyErrorMessage(err) {
    const code = err.code || err.message;
    if (ERROR_MAP[code]) return ERROR_MAP[code];

    // Fallback for generic errors
    if (code.includes('network')) return ERROR_MAP['auth/network-request-failed'];
    return 'Something went wrong. Please try again or refresh the page.';
}

export function showSuccess(title, text = '') {
    return Swal.fire({
        icon: 'success',
        title,
        text,
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true
    });
}

export function showError(err, title = 'Oops...') {
    const message = getFriendlyErrorMessage(err);
    return Swal.fire({
        icon: 'error',
        title,
        text: message,
        confirmButtonColor: 'var(--primary-color)'
    });
}

export function showLoadingToast(title = 'Processing...') {
    return Swal.fire({
        title,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

export function showToast(title, icon = 'success') {
    return Swal.fire({
        title,
        icon,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
}

export async function confirmAction(title, text, confirmButtonText = 'Yes, do it!') {
    const result = await Swal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--primary-color)',
        cancelButtonColor: 'var(--error-color)',
        confirmButtonText
    });
    return result.isConfirmed;
}

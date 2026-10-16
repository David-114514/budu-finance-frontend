const TOKEN = 'token';
const USER = 'currentUser';

export function getToken() {
    return localStorage.getItem(TOKEN);
}

export function getUser() {
    try {
        return JSON.parse(localStorage.getItem(USER) || 'null');
    } catch {
        return null;
    }
}

export function saveSession(token, user) {
    localStorage.setItem(TOKEN, token);
    localStorage.setItem(USER, JSON.stringify(user));
}

export function clearSession() {
    localStorage.removeItem(TOKEN);
    localStorage.removeItem(USER);
}

export function contributorKey() {
    const user = getUser();
    return `budu:contributor:${user?.id ?? 'anon'}`;
}

export function lastEntryKey() {
    const user = getUser();
    return `budu:lastEntry:${user?.id ?? 'anon'}`;
}

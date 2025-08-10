export function checkAuth(context) {
    const { user } = context.clientContext;
    return !!user;
}
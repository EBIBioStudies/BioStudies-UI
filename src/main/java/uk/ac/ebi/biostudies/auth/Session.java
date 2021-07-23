package uk.ac.ebi.biostudies.auth;

/**
 * Created by ehsan on 16/03/2017.
 */
public class Session {
    private static final ThreadLocal<User> context = new ThreadLocal<User>();

    public static void setCurrentUser(User user) {
        context.set(user);
    }

    public static User getCurrentUser() {
        return context.get();
    }
    public static void clear() {
        context.remove();
    }
}

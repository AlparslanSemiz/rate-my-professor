package com.example.ratemyprofessor;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

import android.app.Application;
import android.os.Looper;

import androidx.fragment.app.Fragment;

import com.example.ratemyprofessor.activities.MainActivity;
import com.example.ratemyprofessor.adapters.SearchService;
import com.example.ratemyprofessor.domain.Lecture;
import com.example.ratemyprofessor.domain.Professor;
import com.example.ratemyprofessor.domain.Rater;
import com.example.ratemyprofessor.domain.SemesterSeason;
import com.example.ratemyprofessor.servercommunication.APIService;
import com.example.ratemyprofessor.servercommunication.AuthManager;
import com.example.ratemyprofessor.servercommunication.Database;
import com.example.ratemyprofessor.servercommunication.LoginSession;
import com.example.ratemyprofessor.servercommunication.NetworkUtils;
import com.example.ratemyprofessor.servercommunication.RetrofitClient;
import com.example.ratemyprofessor.servercommunication.responses.AuthState;

import org.mockito.MockedStatic;
import org.robolectric.Robolectric;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.Shadows;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.Collections;
import java.util.concurrent.TimeUnit;
import java.util.function.BooleanSupplier;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;

/** Shared test doubles for UI tests without additional Android test dependencies. */
public final class TestSupport implements AutoCloseable {

    public final APIService api = mock(APIService.class);
    public final SearchService search = mock(SearchService.class);
    public final Database database = mock(Database.class);

    private final MockedStatic<RetrofitClient> retrofitStatic;
    private final MockedStatic<Database> databaseStatic;
    private final MockedStatic<NetworkUtils> networkStatic;

    public TestSupport() {
        Retrofit retrofit = mock(Retrofit.class);
        when(retrofit.create(APIService.class)).thenReturn(api);
        retrofitStatic = mockStatic(RetrofitClient.class);
        retrofitStatic.when(RetrofitClient::getClient).thenReturn(retrofit);

        when(database.searchService()).thenReturn(search);
        databaseStatic = mockStatic(Database.class);
        databaseStatic.when(() -> Database.getInstance(any())).thenReturn(database);

        networkStatic = mockStatic(NetworkUtils.class);
        networkStatic.when(() -> NetworkUtils.isInternetAvailable(any())).thenReturn(true);

        when(search.searchProfessors(anyString())).thenReturn(Collections.emptyList());
        when(search.searchLectures(anyString())).thenReturn(Collections.emptyList());
        when(search.getLectureTitlesByProfessor(anyString())).thenReturn(Collections.emptyList());
        when(search.getProfessorsByLectureTitle(anyString())).thenReturn(Collections.emptyList());
        when(search.getSemestersByProfessorAndLectureTitle(anyString(), anyString()))
                .thenReturn(Collections.emptyList());
        when(search.getLecture(anyString(), anyString(), any(Integer.class), any(SemesterSeason.class)))
                .thenReturn(Collections.emptyList());
        when(search.getLecturesByTitle(anyString())).thenReturn(Collections.emptyList());
        when(search.getComments(anyString())).thenReturn(Collections.emptyList());
        when(search.getReplies(anyString())).thenReturn(Collections.emptyList());
        when(search.getLectureRatings(anyString(), any(Rater.class))).thenReturn(Collections.emptyList());
    }

    public void loggedIn() {
        AuthManager.getInstance().setAuthState(AuthState.LOGGED_IN);
        LoginSession session = LoginSession.from(RuntimeEnvironment.getApplication());
        session.saveMailAddress("abcde@student.kit.edu");
        session.saveTokens("123456", "auth-token");
    }

    public void loggedOut() {
        AuthManager.getInstance().setAuthState(AuthState.LOGGED_OUT);
        LoginSession.from(RuntimeEnvironment.getApplication()).clear();
    }

    public MainActivity launchMainActivity() {
        loggedOut();
        return Robolectric.buildActivity(MainActivity.class).setup().get();
    }

    public <F extends Fragment> F show(MainActivity activity, F fragment) {
        activity.getSupportFragmentManager().beginTransaction()
                .replace(R.id.fragment_container, fragment)
                .commitNow();
        return fragment;
    }

    public void setNetworkAvailable(boolean available) {
        networkStatic.when(() -> NetworkUtils.isInternetAvailable(any())).thenReturn(available);
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    public static <T> Call<T> call(Response<T> response) {
        Call<T> call = mock(Call.class);
        doAnswer(invocation -> {
            Callback<T> callback = invocation.getArgument(0);
            callback.onResponse(call, response);
            return null;
        }).when(call).enqueue(any(Callback.class));
        when(call.isCanceled()).thenReturn(false);
        when(call.clone()).thenReturn(call);
        return call;
    }

    public static <T> Call<T> success(T body) {
        return call(Response.success(body));
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    public static <T> Call<T> failure(Throwable throwable) {
        Call<T> call = mock(Call.class);
        doAnswer(invocation -> {
            Callback<T> callback = invocation.getArgument(0);
            callback.onFailure(call, throwable);
            return null;
        }).when(call).enqueue(any(Callback.class));
        when(call.isCanceled()).thenReturn(false);
        return call;
    }

    public static <T> Call<T> httpError(int status) {
        return call(Response.error(status, ResponseBody.create(null, "error")));
    }

    public static Object invoke(Object target, String name, Class<?>[] types, Object... args) {
        try {
            Method method = target instanceof Class<?>
                    ? ((Class<?>) target).getDeclaredMethod(name, types)
                    : target.getClass().getDeclaredMethod(name, types);
            method.setAccessible(true);
            return method.invoke(target instanceof Class<?> ? null : target, args);
        } catch (ReflectiveOperationException exception) {
            throw new AssertionError(exception);
        }
    }

    public static void setField(Object target, String name, Object value) {
        try {
            Field field = target.getClass().getDeclaredField(name);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException exception) {
            throw new AssertionError(exception);
        }
    }

    @SuppressWarnings("unchecked")
    public static <T> T getField(Object target, String name) {
        try {
            Field field = target.getClass().getDeclaredField(name);
            field.setAccessible(true);
            return (T) field.get(target);
        } catch (ReflectiveOperationException exception) {
            throw new AssertionError(exception);
        }
    }

    public static void await(BooleanSupplier condition) {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(3);
        while (!condition.getAsBoolean() && System.nanoTime() < deadline) {
            Shadows.shadowOf(Looper.getMainLooper()).idle();
            try {
                Thread.sleep(10);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new AssertionError(exception);
            }
        }
        Shadows.shadowOf(Looper.getMainLooper()).idle();
        if (!condition.getAsBoolean()) {
            throw new AssertionError("Timed out waiting for asynchronous UI work");
        }
    }

    public static Application application() {
        return RuntimeEnvironment.getApplication();
    }

    public static Professor professor(String id) {
        return new Professor(id, "Ada", "Lovelace", 3.5f, 7);
    }

    public static Lecture lecture(String id) {
        return new Lecture(id, "Algorithms", "CS101", 2026, SemesterSeason.WS,
                true, 2, 4, 3.5);
    }

    @Override
    public void close() {
        loggedOut();
        networkStatic.close();
        databaseStatic.close();
        retrofitStatic.close();
    }
}

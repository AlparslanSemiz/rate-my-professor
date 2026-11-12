package com.example.ratemyprofessor.servercommunication;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;

/**
 * class for checking if there is internet connection available.
 */
public class NetworkUtils {
    private NetworkUtils() {}

    /**
     * Checks whether Android reports a validated active network.
     *
     * @param context the Android context used to access resources and services
     * @return true if the active network has validated internet access; false otherwise
     */
    public static boolean isInternetAvailable(Context context) {
        ConnectivityManager cm =
                (ConnectivityManager) context.getSystemService(
                        Context.CONNECTIVITY_SERVICE
                );

        Network network = cm.getActiveNetwork();

        if (network == null) {
            return false;
        }

        NetworkCapabilities capabilities =
                cm.getNetworkCapabilities(network);

        return capabilities != null &&
                capabilities.hasCapability(
                        NetworkCapabilities.NET_CAPABILITY_VALIDATED
                );
    }
}

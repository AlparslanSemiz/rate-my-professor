package com.example.myapplication_java.ServerCommunication;

import java.io.InputStream;
import java.util.concurrent.Future;

import okhttp3.ResponseBody;
import retrofit2.Call;

public class ImageRetriever {
    private APIService apiService;
    private String url;
    public ImageRetriever(APIService apiService, String url){
        this.apiService = apiService;
        this.url = url;
    }

    public Future<InputStream> getPicture() {
        Call<ResponseBody> imageCall = apiService.downloadImage(url.replaceFirst("svg", "png"));
        return null;
    }
}

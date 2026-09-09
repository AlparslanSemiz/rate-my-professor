package com.example.ratemyprofessor.ServerCommunication;

import okhttp3.ResponseBody;
import retrofit2.Call;

public class ImageRetriever {
    private final APIService apiService;
    private final String url;
    public ImageRetriever(APIService apiService, String url){
        this.apiService = apiService;
        this.url = url;
    }

    public void getPicture() {
        apiService.downloadImage(url.replaceFirst("svg", "png"));
    }
}

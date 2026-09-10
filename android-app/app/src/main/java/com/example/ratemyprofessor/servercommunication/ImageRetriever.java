package com.example.ratemyprofessor.servercommunication;

/**
 * Creates image download calls using the PNG variant of an image URL.
 */
public class ImageRetriever {
    private final APIService apiService;
    private final String url;
    /**
     * Creates an image retriever for the supplied service and URL.
     *
     * @param apiService the service used to create backend requests
     * @param url the image URL
     */
    public ImageRetriever(APIService apiService, String url){
        this.apiService = apiService;
        this.url = url;
    }

    /**
     * Creates an image download call after replacing the first svg occurrence in the URL with png.
     */
    public void getPicture() {
        apiService.downloadImage(url.replaceFirst("svg", "png"));
    }
}

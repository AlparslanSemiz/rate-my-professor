# frontend


## Retrofit Library

Retrofit is used for communication with the server. 

To initiate communication with the server you use these two boilerplate code snippets:

In the APIService Interface you have this:

```
@POST("/auth/someRoutine")
    Call<String> someRoutine(
            @Body ParameterType parameter
    );
```
"someRoutine" is to be replaced with the Server-Routines name. For that, look in the Backend Code under "AuthController"
This routine can also have parameters, which you include with @Body
.

.

.

.

In your activity class you use this:

```
APIService apiService = RetrofitClient.getClient().create(APIService.class);

            Call<String> call = apiService.login(request); <-- example

            call.enqueue(new Callback<String>() {
                @Override
                public void onResponse(Call<String> call, Response<String> response) {
                    if(response.isSuccessful) {
                        int someData = response.body;
                    } else {
                    }

                }

                @Override
                public void onFailure(Call<String> call, Throwable t) {

                }
            });
```

At      "Call<String> call = apiService."     you specify which server routine you want to use and give the needed parameters as specified in the APIService Interface



"call.enqueue" then actually executes the server communication, while "Callback" handles the servers answer.

In      "onFailure"      you handle the case where the communication failed, due to Network failure or an exception

"onResponse" handles the case where contact with the server was made. Though, the server can still return an error, for which "if(response.isSuccessful)" is used.

With "response.body" you extract the data the server returned.

## TODO
- Insert Server URL in "RetrofitClient" class, so communication can actually be tested
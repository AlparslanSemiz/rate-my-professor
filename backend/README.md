# Backend



# Functions


## Passwordless login

### Example Interaction
>- [ ]  User enters E-Mail
>- [ ]  Backend creates one time Token
>- [ ]  Backend sends Token to E-Mail adress
>- [ ]  User clicks link
>- [ ]  Backend checks Token 
>- [ ]  Backend creates session or similar
>- [ ]  User is logged in


# What we need:


- ## Login Database
    - id: Integer [PrimaryKey]
    - email: String
    - token: Text
    - expires_AT: Time
    - used: boolean


- ## Server Endpoint (to send Data from Client)
    - POST: {"email" = uabcd@student.kit.edu}

- ## Create secure Token
    - TODO (idk how exactly)

- ## Create magic Link
    - ourapp://login?token=abc123 

- ## Send Email 
    - TODO

- ## Server Endpost to verify Token
    - GET /auth/magic?token=abc123
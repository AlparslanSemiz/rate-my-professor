# Backend

---

# Functions

## Passwordless Login

<details>
<summary><strong>Example Interaction</strong></summary>

>- [ ] User enters E-Mail  
>- [ ] Backend creates one time Token  
>- [ ] Backend sends Token to E-Mail adress  
>- [ ] User clicks link  
>- [ ] Backend checks Token  
>- [ ] Backend creates session or similar  
>- [ ] User is logged in  

</details>

---

# What we need:

<details>
<summary><strong>Login Database</strong></summary>

Database: PostgreSQL

Login Table Attributes
- id: Integer [PrimaryKey]
- email: String
- token: Text
- expires_AT: Time
- used: boolean



</details>

---

<details>
<summary><strong>Server Endpoint (to send Data from Client)</strong></summary>

With REST API 

- POST: `{"email" = uabcd@student.kit.edu}`

</details>

---

<details>
<summary><strong>Create secure Token</strong></summary>


- TODO (idk how exactly)

</details>

---

<details>
<summary><strong>Create magic Link</strong></summary>


- `ourapp://login?token=abc123`

</details>

---

<details>
<summary><strong>Send Email</strong></summary>


- TODO

</details>

---

<details>
<summary><strong>Server Endpoint to verify Token</strong></summary>

- `GET /auth/magic?token=abc123`

</details>

## Used Software/Frameworks

- Spring Boot
- PostgreSQL

Note: used AI to format this markdown File
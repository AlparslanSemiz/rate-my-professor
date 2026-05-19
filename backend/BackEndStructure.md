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

- Github

Not installed:
- Spring Boot
- PostgreSQL

## Done

<details><summary>Synced Server with Gitlab Repo</summary>


> Synchranisation is **not** yet automated!

> **Only** `backend` folder is snycronized! (as it should)


### Standard Usage

Get Repo:
- `git pull`

Push changes:
- `git add file.java`
- `git commit -m "new feature"`
- `git push`

</details>

<details><summary>PostgreSQL installed</summary>

### Useful commands:

Start PostgreSQL
- `sudo systemctl start postgresql`

Stop PostgreSQL
- `sudo systemctl stop postgresql`

Open PostgreSQL
- `sudo -u postgres psql`

Show all Tables
- `\dt`

Show Table contents
-  `SELECT * FROM magic_login_tokens;`

Quit Viewer
- `press q `

Other:
- Use standard SQL Commands
</details>


<details><summary>PostgreSQL Login Table created</summary>


- table `magic_login_tokens` created
</details>


Spring Boot

`https://start.spring.io/`

```
Settings:
Project: Maven
Language: Java
Spring Boot: 4.0.6
Packaging: Jar
Java: 21

Dependencies:
- Spring Web
```





<details><summary>Minor changes</summary>

- Changed Timezone to Berlin instead of UTC +0
- Installed java on Server

</details>






Note: used AI to format this markdown File
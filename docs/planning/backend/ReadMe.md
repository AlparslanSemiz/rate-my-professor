# Doc 


## Beware 

> The sever is hosted by bwCloud **not** bwSync&Share! (bwSync&Share only acts as a cloud for an end user, not as proper backend server)

# BackEnd

> Server used is hostes by bwcloud (bwcloud-os.de/)

## Login & Register Procedure:

\> Login via https://portal.bw-cloud.org/auth/login/?next=/ 

\> select bwIDM via OpenID Connect 

\> login 

\> select kit 

\> login  

\> read terms & register 


# Using Server

## Create Server

\> create new Instance (click through dialoge)

## Create SSH KEY (Schlüsselpaar)

\> in console `ssh-keygen`

\> press enter

\> import key `id_ed25519.pub` in bwCloud as SSH Key

\> create Instance

## connect via SSH

\> in console `ssh ubuntu@192.168.2.1`

\> confirm connection request

## Use VsCode to ssh into (Recommende)

\> install Extension `Remote - SSH`

\> `F1` in VsCode

\> type `Remote-SSH: Connect to Host`

\> enter host e.g. `ubuntu@192.168.2.1`

\> `Enter`

\> `open folder`

\> Open home directory e.g. `/home/ubuntu`

## Generel Information


current Instance link: 
(removed: the course server no longer exists)


# Server Specs
- 1 vCPU, 
- 1 GB RAM  
- 50 GB Plattenplatz 
- feste IPv4- und IPv6-Adresse aus dem BelWue-Netzgebiet.
- Laufzeit: 6 Monate


# final project link
- https://portal.bw-cloud.org/project/ 


## Useful links

- https://portal.bw-cloud.org/project/api_access/ 
- https://www.scc.kit.edu/dienste/bwcloud.php 

## Question

- Shared access to server  
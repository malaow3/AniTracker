# AniTracker
#### Anitracker is a Typescript Application which fetches a user's [Crunchyroll](https://crunchyroll.com) and/or [Funimation](https://funimation.com) watch history and will provide them the options to update entries automatically on [Anilist](https://anilist.co)

<br>

### Installing and Running 
In order to run AniTracker a few requirements are needed:
1. Web hosting platform
2. PSQL Database
3. Anilist app token credentials

To host easily, please follow the instructions outlined below:
- Setup an account on replit.com
- Once your account is created, fork the following [repl](https://replit.com/@malaow3/anitracker)
- Create a free "Tiny Turtle" PSQL instance from [Elephantsql](https://www.elephantsql.com/plans.html)
- Make note of the URL for the Database as we will need this later (you can keep this tab open)
- Go to the [Anilist developer settings](https://anilist.co/settings/developer) and create a new client, fill in the name and set the redirect url to be "https://anilist.co/api/v2/oauth/pin"
- Then navigate to https://anilist.co/api/v2/oauth/authorize?client_id={client_id}&response_type=token where "{client_id}" is replaced with your client ID
- Authorize the account usage and keep this tab open as we will need the token that is printed out
- Lastly, visit https://en.wikipedia.org/wiki/List_of_tz_database_time_zones to figure out your time zone (for example, America/New_York)
- Returning to replit.com, navigate to the "Secrets" tab and click on "Open raw editor"
- Copy the following into the raw editor
  ```
  {
      "funusername": "your funimation username",
      "funpassword": "your funimation password",
      "db": "the db url from elephantsql",
      "crunchyusername": "your crunchyroll username",
      "crunchypassword": "your crunchyroll password",
      "tz": "the timezone from before",
      "anilistToken": "the anilist token from before",
      "siteuser": "username you'd like to set for the site",
      "sitepass": "password you'd like to use for the site"
  }
  ```
- Run `./runner.sh` and the page should spin up
  
**Important Extra Step**
- Since replit.com is a free service, the webpage will shut down if not being constantly pinged. To get around this, create an account on https://uptimerobot.com/ and create a new HTTP(s) monitor, where the URL is set to your replit webpage and the interval is 5 minutes.

If when you run the first time it fails with "Unable to connect to DB", type `exit` into the shell, and then re-run - the environment variables may not have properly loaded.
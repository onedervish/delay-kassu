# 💰 Delay Kassu

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version: 23](https://img.shields.io/badge/version-23-blue.svg)](../../releases)
[![PWA: installs from the web](https://img.shields.io/badge/PWA-installs_from_the_web-0f8f7f.svg)](https://app.delaykassu.ru)

### Shifts. Orders. Hours. Money. No accounting voodoo.

**Delay Kassu** is a free app for couriers and anyone who works shifts or gets paid per order.

Finished a shift → logged your earnings and orders → immediately saw what you made **per hour and per order**.

**No sign-up. No ads. No accounts.**  
Your records stay on your own device.

🌐 **App:** https://app.delaykassu.ru  
🏠 **Website:** https://delaykassu.ru  
💬 **Telegram:** https://t.me/delaykassu

---

## 📱 What it looks like

<p align="center">
  <img src="docs/screenshots/main.webp" width="320" alt="Delay Kassu main screen">
</p>

---

## 🤨 Why count shifts at all?

You can write your earnings on a scrap of paper.

You can keep a spreadsheet.

You can write nothing down and confidently say in the evening:

> **"Eh, earned a decent amount today."**

Except 5,000 ₽ for 5 hours and 5,000 ₽ for 11 hours is the same money for **very different shifts**.

Delay Kassu shows more than the final number.

The app tracks:

- 💰 earnings;
- ⏱️ hours;
- 📦 orders;
- 💵 earnings per hour;
- 🧾 earnings per order;
- 📊 the last seven days.

**The till shows how much money you earned.  
The hourly rate shows at what cost.**

---

## ⚡ Logging a shift takes about 15 seconds

For a plain entry you only need:

**orders + earnings → save.**

If you want more detail, you can add:

- shift start and end time;
- number of hours;
- tips;
- kilometres;
- a note.

If you enter the start and end time, the app works out the duration itself.

No 48-column spreadsheets.

You finished a shift, you didn't take a job as an accountant.

---

## 📊 What it does

### Counts the day

The main screen shows:

- how much you earned;
- how many shifts there were;
- how many orders you completed;
- how many hours you worked;
- your rate per hour;
- your rate per order.

Rates are calculated from the whole sum, all hours and all orders of the day - not as an average of individual shifts.

### Shows the last seven days

Seven bars show your earnings day by day.

Tap a day → you see its results and shifts.

Under the chart is the total for the whole week.

### Remembers services

Ready-made options:

- Ozon
- Kuper
- Magnit
- Yandex
- VkusVill
- Samokat

You can add your own service with any name and colour.

Even "Taxi".

Even "Warehouse".

Even "Odd jobs for Uncle Vitya".

### Hides your money from curious eyes

Tap the eye icon and the amounts turn into dots.

Handy when someone looks over your shoulder and suddenly takes a keen interest in your financial life.

### Exports records

Two options:

**Spreadsheet** - a file with all your shifts that opens in Excel.

**Full backup** - shifts, services, colours and settings.

The full backup is what moves your data to another phone.

---

## 📲 How to install

Delay Kassu installs straight from the website.

**No app store needed.**

👉 https://app.delaykassu.ru

<details>
<summary><b>🤖 Android - Chrome</b></summary>

1. Open https://app.delaykassu.ru in Chrome.
2. Tap the three dots in the top right.
3. Choose **"Install app"** or **"Add to Home screen"**.
4. Confirm.

The icon appears on your home screen.

</details>

<details>
<summary><b>🔴 Android - Yandex Browser</b></summary>

1. Open https://app.delaykassu.ru in Yandex Browser.
2. Open the menu.
3. Choose **"Add to Home screen"** or **"Add shortcut"**.
4. Confirm.

</details>

<details>
<summary><b>🍏 iPhone - Safari</b></summary>

On iPhone the app installs through **Safari**.

1. Open https://app.delaykassu.ru in Safari.
2. Tap **Share**.
3. Scroll down in the menu.
4. Choose **"Add to Home Screen"**.
5. Tap **"Add"**.

After that, open the app from the icon on your home screen.

</details>

<details>
<summary><b>💻 Desktop</b></summary>

Just open:

https://app.delaykassu.ru

in Chrome or Yandex Browser.

If the browser offers to install the app, you can install it into its own window.

</details>

After the first load the app can work **offline**.

---

## 🔒 Is my data sent anywhere?

No.

The app has no sign-up, and records are stored **locally on your own device**.

That is deliberate.

No account.  
No cloud sync.  
No server holding your shift history.

But there is a flip side.

### ⚠️ Make backups

If you lose your phone, clear browser data or delete the app's local data, your records can be lost.

That is why Delay Kassu can create backups and reminds you about it from time to time.

Better still, keep a copy somewhere other than the phone itself - send it:

- to yourself on Telegram;
- by email;
- to cloud storage.

**A backup kept on a lost phone helps about as much as a spare key locked inside your flat.**

---

## 🔄 A new phone

On the old phone:

**Settings → Full backup**

Save the file and send it to yourself.

On the new phone:

1. install Delay Kassu;
2. save the backup file;
3. tap **"Load"**;
4. pick the file;
5. choose **"Replace everything"**.

Shifts, services, colours and settings all move across.

---

## 🧠 What you should know honestly

The project is still growing, so no marketing make-up.

### iPhone

Development and testing were done on Android, including old and low-end devices.

**The author has not yet properly tested iPhone and Safari.**

### Statistics

The main screen currently shows the day and the last seven days.

Monthly and yearly statistics and period comparison are not implemented yet.

### Fuel cost

There is a fuel cost setting, but it does not take part in any calculations yet.

### Different browsers - different records

Chrome and Yandex Browser keep local data separately.

If you logged shifts in Chrome, then opened the app in another browser and saw an empty screen, that does not necessarily mean your data is gone.

Open the app where you entered your records.

### Delivery services

Delay Kassu **is not an app of Ozon, Kuper, Magnit, Yandex, VkusVill or Samokat and is not connected with these companies**.

The names are used only as labels for shifts.

The app does not receive data from delivery services and calculates results only from the numbers the user enters.

---

## 💸 Is it free?

Yes.

The current version is free and has no ads.

**The free core of the project will never be cut down.**

---

# 👨‍💻 For developers

If you came here not to count shifts but to see **what this thing has under the hood** - welcome to the engine room.

The project is deliberately built without heavy artillery.

### Stack

- HTML
- CSS
- JavaScript
- IndexedDB
- Service Worker
- Onest
- Unbounded

No front-end frameworks.

No bundlers.

No separate backend server.

User records are stored locally in IndexedDB.

The Service Worker lets the app work without a constant internet connection.

---

## 🏠 Host it yourself

Download the source via:

**Code → Download ZIP**

or from the **Releases** section.

Unpack the contents into a directory of your own site.

### Apache

If you use Apache, put the `.htaccess` file from the archive next to it.

On some hosts, without the right configuration, the manifest is served with the wrong MIME type, which breaks installing the app to the home screen.

The app needs no separate database or backend.

**It is a static app.**

---

## 📦 Releases

If you just want to use Delay Kassu, you do not need to download a ZIP from GitHub.

Open:

👉 https://app.delaykassu.ru

and install the app to your home screen.

**Releases** are for when you want to:

- get the archive of a specific version;
- deploy the app yourself;
- study or modify the source;
- keep a working version locally.

---

## 🔄 Updates

When a new version appears, the app shows a notification:

**"Update available"**

You start the update yourself with the **"Update"** button.

Existing records are not deleted by an update.

---

## 🐛 Found a bug?

Now that is interesting.

If something is broken, behaves strangely, or you are just staring at some button thinking:

> **"Who on earth builds it like this?"**

tell us about it.

💬 **Telegram:** https://t.me/delaykassu

Suggestions and ideas are welcome there too.

The project is alive and will keep improving based on user feedback.

---

## 📄 License

The project is distributed under the **MIT** license.

You may use, copy, modify and distribute the code under the terms of that license.

When redistributing, you must keep the copyright notice and the license text.

See the [`LICENSE`](LICENSE) file.

---

## 💰 Delay Kassu

**Work with your hands. Let the app count the money.**

🌐 https://app.delaykassu.ru  
🏠 https://delaykassu.ru  
💬 https://t.me/delaykassu

---

**Русская версия:** [README.md](README.md)

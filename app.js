const express = require("express");
const app = express();
const userRouter = require("./routes/student");
const userRouter2 = require("./routes/podst");
const userRouter3 = require("./routes/srednie");
const loginRouter = require("./routes/login");
const logoutRouter = require("./routes/logout");
const adminRouter = require("./routes/adminPage");
const detailsRouter = require("./routes/details");
const usnieteRouter = require("./routes/usuniete");
const testRouter = require("./routes/test");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");

const CLIENT_ID =
    "445263253879-l1tld396vanturll5ck8kakskrbjutb9.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN =
    "1//041tSdUrO9OcZCgYIARAAGAQSNwF-L9IrS33ASLDxZVsSLKWyE85qyg6xD4TgGsSeX7_3OVwW3taYBvjaIeQwRpnydBpnqye16Cc";

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const cookieParser = require("cookie-parser");
const session = require("express-session");
const ONE_HOUR = 1000 * 60 * 60;

const port = process.env.PORT || 8080;
app.set("port", port);

app.use(
    session({
        secret: "admin",
        resave: false,
        saveUnitialized: false,
        cookie: {
            maxAge: ONE_HOUR,
        },
    })
);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(__dirname + "/public/stylesheets"));
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/views"));
app.use(express.static(__dirname + "/public/javasctipts"));
app.set("view engine", "ejs");
app.get("/", (req, res) => {
    res.render("index");
});
app.use("/student", userRouter);
app.use("/podst", userRouter2);
app.use("/srednie", userRouter3);
app.use("/login", loginRouter);
app.use("/logout", logoutRouter);
app.use("/adminPage", adminRouter);
app.use("/details", detailsRouter);
app.use("/usuniete", usnieteRouter);
app.use("/test", testRouter);

const db = require("./models");
const { user } = require("./models");
const { register } = require("./models");
const { grupy } = require("./models");
const { toDoList } = require("./models");

db.sequelize.sync().then((req) => {
    app.listen(8080, () => {
        console.log("Serwer uruchomiony");
    });
});

app.post("/adminPage/register", async(req, res) => {
    const loginadmin = req.body.login;
    //const checklogin = await register.findOne({ where: { login: loginadmin } });
    const transaction = await db.sequelize.transaction();
    try {
        const checklogin = await register.findOne({
            where: { login: loginadmin },
        }, {
            transaction,
        });
        await transaction.commit();
        //---
        const transaction2 = await db.sequelize.transaction();
        if (checklogin === null) {
            try {
                const hashedPassword = await bcrypt.hash(req.body.password, 10);
                register
                    .create({
                        login: req.body.login,
                        password: hashedPassword,
                        edit: 0,
                        add: 0,
                        delete: 0,
                        power: 0,
                        active: 0,
                    }, {
                        transaction2,
                    })
                    .then(function(register) {
                        if (register) {
                            res.render("register.ejs", {
                                message2: "Pomyślne dodanie do bazy...",
                            });
                        } else {
                            res.render("register.ejs", { message: "Błąd przy dodawaniu..." });
                        }
                    })
                    .then(async(x) => {
                        await transaction2.commit();
                    });
            } catch {
                await transaction2.rollback();
                res.redirect("/adminPage/register");
            }
        } else {
            res.render("register.ejs", { message: "Taki login już istnieje..." });
        }
        //---
    } catch (error) {
        await transaction.rollback();
    }
});

app.post("/login", async(req, res) => {
    const { login, password } = req.body;
    try {
        const admin = await register.findOne({ where: { login } });
        if (await bcrypt.compare(password, admin.password)) {
            req.session.admin = true;
            req.session.yId = admin.id
            res.redirect("/adminPage");
        } else {
            res.render("login.ejs", { message: "Niepoprawne login lub hasło..." });
        }
    } catch {
        res.render("login.ejs", { message: "Niepoprawne login lub hasło..." });
    }
});

app.post("/adminPage-delete-:id", async(req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        if (req.session.delete == 1) {
            user
                .update({
                    active: 0,
                }, {
                    where: {
                        grupyid: req.params.id,
                    },
                }, {
                    transaction,
                })
                .then(async(x) => {
                    await transaction.commit();
                })
                .then(async(x) => {
                    const transaction = await db.sequelize.transaction();
                    try {
                        grupy
                            .update({
                                active: 0,
                            }, {
                                where: {
                                    id: req.params.id,
                                },
                            }, {
                                transaction,
                            })
                            .then((note) => res.redirect("/adminPage"))
                            .then(async(x) => {
                                await transaction.commit();
                            });
                    } catch {
                        await transaction.rollback();
                    }
                });
        }
    } catch {
        await transaction.rollback();
    }
});

app.post("/adminPage-back-:id", async(req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        user
            .update({
                active: 1,
            }, {
                where: {
                    grupyid: req.params.id,
                },
            }, {
                transaction,
            })
            .then(async(x) => {
                await transaction.commit();
            })
            .then(async function(x) {
                const transaction = await db.sequelize.transaction();
                try {
                    grupy
                        .update({
                            active: 1,
                        }, {
                            where: {
                                id: req.params.id,
                            },
                        }, {
                            transaction,
                        })
                        .then((note) => res.redirect("/usuniete"))
                        .then(async(x) => {
                            await transaction.commit();
                        });
                } catch {
                    await transaction.rollback();
                }
            });
    } catch {
        await transaction.rollback();
    }
});

app.post("/adminPage-usun-:id", async(req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        grupy
            .destroy({
                where: {
                    id: req.params.id,
                },
            }, {
                transaction,
            })
            .then((note) => res.redirect("/usuniete"))
            .then(async(x) => {
                await transaction.commit();
            });
    } catch {
        await transaction.rollback();
    }
});

app.post("/adminPage-usunAll", async(req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        grupy
            .destroy({
                where: {
                    active: 0,
                },
            }, {
                transaction,
            })
            .then((note) => res.redirect("/usuniete"))
            .then(async(x) => {
                await transaction.commit();
            });
    } catch {
        await transaction.rollback();
    }
});

app.post("/adminPage/details-:id", async(req, res) => {
    const grupa = await grupy.findOne({ where: { id: req.params.id } });
    const grupies = await user
        .findAll({
            where: { grupyId: req.params.id },
        })
        .then((user) => {
            res.render("details", {
                user,
                grupa,
            });
        });

});

app.post("/update-:id", function(req, res) {
    grupy
        .update({
            nazwaZespolu: req.body.teamname,
            nazwaSzkoly: req.body.schoolname,
            stopienSzkoly: req.body.schoollevel,
        }, {
            where: { id: req.params.id },
        })
        .then(function(x) {
            for (var i = 1; i < 6; i++) {
                user.update({
                    imie: eval("req.body.imie" + i),
                    nazwisko: eval("req.body.nazwisko" + i),
                    email: eval("req.body.email" + i),
                    index: eval("req.body.index" + i),
                }, {
                    where: {
                        id: eval("req.body.userId" + i),
                    },
                });
            }
        });
    res.redirect("/adminPage");
});

app.post("/adminPage/admindetails", async(req, res) => {
    const checklogin = await register.findOne({
        where: { login: req.body.loginchange },
    });
    if (checklogin == null) {
        register.update({
            login: req.body.loginchange,
        }, {
            where: {
                login: req.session.nick,
            },
        });
        res.render("admindetails.ejs", { message: "Pomyślna zmiana loginu..." });
    } else {
        res.render("admindetails.ejs", { message2: "Taki login już istnieje..." });
    }
});

app.post("/adminPage/admindetails2", async(req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.passchange, 10);
    if (req.body.passchange == req.body.passchange2) {
        register.update({
            password: hashedPassword,
        }, {
            where: {
                login: req.session.nick,
            },
        });
        res.render("admindetails.ejs", { message: "Pomyślna zmiana hasła..." });
    } else
        res.render("admindetails.ejs", { message2: "Hasła się nie zgadzają..." });
});

app.post("/deleteadminacc", async(req, res) => {
    register.destroy({
        where: {
            login: req.session.nick,
        },
    });
    req.session.destroy();
    res.redirect("/login");
});

app.post("/admins-delete-:id", async(req, res) => {
    await register.destroy({
        where: {
            id: req.params.id,
        },
    });
    res.redirect("/adminPage/admins");
});

app.post("/admins-addedit-:id", async(req, res) => {
    await register.update({ edit: 1 },

        {
            where: {
                id: req.params.id,
            },
        }
    );
    res.redirect("/adminPage/admins");
});
app.post("/admins-takeedit-:id", async(req, res) => {
    await register.update({ edit: 0 },

        {
            where: {
                id: req.params.id,
            },
        }
    );
    res.redirect("/adminPage/admins");
});
app.post("/admins-adddelete-:id", async(req, res) => {
    await register.update({ delete: 1 },

        {
            where: {
                id: req.params.id,
            },
        }
    );
    res.redirect("/adminPage/admins");
});
app.post("/admins-takedelete-:id", async(req, res) => {
    await register.update({ delete: 0 },

        {
            where: {
                id: req.params.id,
            },
        }
    );
    res.redirect("/adminPage/admins");
});
app.post("/admins-addadd-:id", async(req, res) => {
    await register.update({ add: 1 },

        {
            where: {
                id: req.params.id,
            },
        }
    );
    res.redirect("/adminPage/admins");
});
app.post("/admins-takeadd-:id", async(req, res) => {
    await register.update({ add: 0 },

        {
            where: {
                id: req.params.id,
            },
        }
    );
    res.redirect("/adminPage/admins");
});

app.post("/postteam", async(req, res) => {
    const school = req.body.schoollevel;
    const groupname = req.body.teamname;
    const checkgroup = await grupy.findOne({
        where: { nazwaZespolu: groupname },
    });

    if ((await checkgroup) == null) {
        // const transaction = await db.sequelize.transaction();
        try {
            await db.sequelize.transaction(async function(t) {
                await grupy
                    .create({
                        nazwaZespolu: req.body.teamname,
                        nazwaSzkoly: req.body.schoolname,
                        stopienSzkoly: req.body.schoollevel,
                        active: 1,
                    }, {
                        transaction: t,
                    })
                    .then(async function(x) {

                        const accessToken = await oAuth2Client.getAccessToken();

                        const transport = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                type: 'OAuth2',
                                user: 'hackatonans@gmail.com',
                                clientId: CLIENT_ID,
                                clientSecret: CLIENT_SECRET,
                                refreshToken: REFRESH_TOKEN,
                                accessToken: accessToken,
                            },
                            tls: {
                                rejectUnauthorized: false
                            }
                        });

                        const mailOptions = {
                            from: 'HackatonANS <hackatonans@gmail.com>',
                            to: req.body.email1,
                            subject: 'Hackaton Zapisy',
                            text: "Hej " + req.body.imie1 + ", informuję, że twój zapis drużyny " + req.body.teamname + " przeszedł pomyślnie, powodzenia :)",
                        };

                        await transport.sendMail(mailOptions);


                        let groupid = x.id;

                        const itemArray = [];
                        encja1 = {
                            imie: req.body.imie1,
                            nazwisko: req.body.nazwisko1,
                            email: req.body.email1,
                            index: req.body.index1,
                            grupyId: groupid,
                            active: 1,
                        }
                        encja2 = {
                            imie: req.body.imie2,
                            nazwisko: req.body.nazwisko2,
                            email: req.body.email2,
                            index: req.body.index2,
                            grupyId: groupid,
                            active: 1,
                        }
                        encja3 = {
                            imie: req.body.imie3,
                            nazwisko: req.body.nazwisko3,
                            email: req.body.email3,
                            index: req.body.index3,
                            grupyId: groupid,
                            active: 1,
                        }
                        encja4 = {
                            imie: req.body.imie4,
                            nazwisko: req.body.nazwisko4,
                            email: req.body.email4,
                            index: req.body.index4,
                            grupyId: groupid,
                            active: 1,
                        }
                        encja5 = {
                            imie: req.body.imie5,
                            nazwisko: req.body.nazwisko5,
                            email: req.body.email5,
                            index: req.body.index5,
                            grupyId: groupid,
                            active: 1,
                        }
                        itemArray.push(encja1);
                        itemArray.push(encja2);
                        itemArray.push(encja3);
                        itemArray.push(encja4);
                        itemArray.push(encja5);
                        console.log(itemArray)

                        return user.bulkCreate(itemArray, { transaction: t }).then(() => {

                            //itemArray = [];
                        }, err => {
                            console.log("ERROR: " + err)
                        })

                    })



                if (school == "podst")
                    return res.render("podst.ejs", {
                        message: "Pomyślne zapisanie drużyny :)",
                    });

                if (school == "student")
                    return res.render("student.ejs", {
                        message: "Pomyślne zapisanie drużyny :)",
                    });

                if (school == "srednie")
                    return res.render("srednie.ejs", {
                        message: "Pomyślne zapisanie drużyny :)",
                    });
            });
        } catch {

            if (school == "podst")
                res.render("podst.ejs", {
                    message2: "Nieoczekiwany błąd spróbuj ponownie...",
                });

            if (school == "student")
                res.render("student.ejs", {
                    message2: "Nieoczekiwany błąd spróbuj ponownie...",
                });

            if (school == "srednie")
                res.render("srednie.ejs", {
                    message2: "Nieoczekiwany błąd spróbuj ponownie...",
                });
        }
    } else {
        if (school == "podst")
            res.render("podst.ejs", {
                message2: "Niestety taka nazwa drużyny jest już zajęta...",
            });

        if (school == "student")
            res.render("student.ejs", {
                message2: "Niestety taka nazwa drużyny jest już zajęta...",
            });

        if (school == "srednie")
            res.render("srednie.ejs", {
                message2: "Niestety taka nazwa drużyny jest już zajęta...",
            });
    }
});

app.post('/szukaj', async(req, res) => {
    global.znajdz = req.body.szukaj
    res.redirect('/adminPage/search')
})

app.post('/szukaj2', async(req, res) => {
    global.znajdz2 = req.body.szukaj2
    res.redirect('/adminPage/searchadmin')
})
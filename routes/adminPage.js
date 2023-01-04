const express = require("express");
const router = express.Router();
const isadmin = require("../public/javascripts/authorize");
const db = require("../models");
const { user } = require("../models");
const { grupy } = require("../models");
const { register } = require("../models");

router.get("/", isadmin, async(req, res) => {
    const transaction = await db.sequelize.transaction();
    try {

        const grupies = await grupy
            .findAll({
                where: {
                    active: 1,
                },
            }, {
                transaction,
            })
            .then(async(grupies) => {
                await transaction.commit();
                res.render("adminPage", {
                    grupies,
                });
            });
    } catch {
        await transaction.rollback();
    }
});
router.get("/search", isadmin, async(req, res) => {
    const Sequelize = require('sequelize')
    const Op = Sequelize.Op
    const grupa = await grupy.findAll({ where:{
        [Op.or]:{
        nazwaZespolu:{[Op.like]: '%'+znajdz+'%'},
        nazwaSzkoly:{[Op.like]: '%'+znajdz+'%'}
    }
    },}).then((grupa) => {
        res.render('search',{
            grupa,
        })})
})
router.get("/searchadmin", isadmin, async(req, res) => {
    const Sequelize = require('sequelize')
    const Op = Sequelize.Op
    const registers = await register.findAll({ where:{
      
        login:{[Op.like]: '%'+znajdz2+'%'},
    },
}).then((register) => {
        res.render('searchadmin',{
            register,
        })})
})

router.get("/admins", isadmin, async(req, res) => {
    if (req.session.power == 1) {
        const registers = await register.findAll({}).then((registers) => {
            res.render("admins", {
                registers,
            });
        });
    } else { res.redirect('/adminPage') }
});
router.get("/podst", isadmin, async(req, res) => {
    const stopien1 = "podst";
    const grupies = await grupy
        .findAll({
            where: {
                stopienSzkoly: stopien1,
                active: 1,
            },
        }, {
            include: user,
        })
        .then((grupies) => {
            res.render("adminPage", {
                grupies,
            });
        });
});
router.get("/admins", isadmin, async(req, res) => {

    if (Moc == 1) {
        const registers = await register.findAll({}).then((registers) => {
            res.render("admins", {
                registers,
            });
        });
    }
});
router.get("/podst", isadmin, async(req, res) => {
    const stopien1 = "podst";
    const grupies = await grupy
        .findAll({
            where: {
                stopienSzkoly: stopien1,
                active: 1,
            },
        }, {
            include: user,
        })
        .then((grupies) => {
            res.render("adminPage", {
                grupies,
                uprEdit: uprEdit,
            });
        });
});
router.get("/srednie", isadmin, async(req, res) => {
    const stopien1 = "srednie";
    const grupies = await grupy
        .findAll({
            where: {
                stopienSzkoly: stopien1,
                active: 1,
            },
        }, {
            include: user,
        })
        .then((grupies) => {
            res.render("adminPage", {
                grupies,
            });
        });
});
router.get("/student", isadmin, async(req, res) => {
    const stopien1 = "student";
    const grupies = await grupy
        .findAll({
            where: {
                stopienSzkoly: stopien1,
                active: 1,
            },
        }, {
            include: user,
        })
        .then((grupies) => {
            res.render("adminPage", {
                grupies,
            });
        });
});
router.get("/usuniete", isadmin, async(req, res) => {
    const grupies = await grupy
        .findAll({
            where: {
                active: 0,
            },
        }, {
            include: user,
        })
        .then((grupies) => {
            res.render("adminPage", {
                grupies,
                uprEdit: uprEdit,
                uprDelete: uprDelete,
            });
        });
});

router.get("/register", isadmin, (req, res) => {

    if (uprAdd == 1) {
        res.render("register");
    }
});

router.get("/admindetails", isadmin, (req, res) => {
    res.render("admindetails");
});



module.exports = router;
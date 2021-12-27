module.exports.isManager = (req, res, next) => {
    if (!req.isAuthenticated() || !req.user) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be an employee!')
        return res.redirect('/employee/login')
    }
    next();
}
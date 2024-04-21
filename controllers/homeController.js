const renderHome = (_req, res) => {
	res.render('home', { title: 'Home', isHomepage: true });
};

module.exports = { renderHome };
// Render the home page function
const renderHome = (_req, res) => {
	res.render('pages/home', { title: 'Home', isHomepage: true });
};

module.exports = { renderHome };

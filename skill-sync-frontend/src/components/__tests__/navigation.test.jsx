import { colorsFor, menuItemsFor, pageTitleFor, ROLE_COLORS } from '../layout/navigation';

test('each role gets its own palette, and an unknown role the student one', () => {
    expect(colorsFor('company').primary).toBe('#2e7d32');
    expect(colorsFor('admin').primary).toBe('#d32f2f');
    expect(colorsFor(undefined)).toBe(ROLE_COLORS.student);
});

test('every role starts at the dashboard and each role sees only its own pages', () => {
    const paths = (role) => menuItemsFor(role).map((item) => item.path);

    for (const role of ['student', 'company', 'admin']) {
        expect(paths(role)[0]).toBe('/dashboard');
    }
    expect(paths('student')).not.toContain('/intelligent-ranking');
    expect(paths('company')).not.toContain('/applications');
    expect(paths('admin')).not.toContain('/company/profile');
    expect(menuItemsFor('guest')).toEqual([]);
});

test('the same path can carry a different name per role', () => {
    const titleFor = (role) => pageTitleFor('/internships', menuItemsFor(role));

    expect(titleFor('student')).toBe('Browse Internships');
    expect(titleFor('company')).toBe('My Internships');
    expect(titleFor('admin')).toBe('All Internships');
});

test('pages outside the menu have their own title or fall back to SkillSync', () => {
    expect(pageTitleFor('/internships/create', menuItemsFor('company'))).toBe('Post New Internship');
    expect(pageTitleFor('/nowhere', menuItemsFor('company'))).toBe('SkillSync');
});

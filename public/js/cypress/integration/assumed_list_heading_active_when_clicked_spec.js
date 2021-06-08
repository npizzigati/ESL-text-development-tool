describe('assumed list header', () => {
  it('it becomes active when clicked on', () => {
    cy.visit('/');
    cy.intercept({ method: 'POST', url: '/'}).as('headwordsRequest');
    cy.get('[data-cy="file-input"]')
      .attachFile('headwords_order_of_frequency.txt');
    cy.wait('@headwordsRequest');

    // Heading should not be active before clicking on it
    // cy.get('[data-cy=assumed-list-title]').should('not.have.class', 'active-list-title');
    cy.get('[data-cy=assumed-list-title]').should(($span) => {
      if ($span.attr('class') !== undefined && $span.attr('class').match(/active/)) {
        throw 'heading is activated before being clicked on';
      }
    });

    cy.get('[data-cy=assumed-list-title]').click();

    // Heading should be active after clicking on it
    cy.get('[data-cy=assumed-list-title]')
      .should(($span) => {
        const className = $span[0].className;
        expect(className).to.match(/active/);
      });
  });
});

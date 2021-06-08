describe('upload mechanism', () => {
  it('uploads headwords file successfully', () => {
    cy.visit('/');
    cy.intercept({ method: 'POST', url: '/'}).as('headwordsRequest');
    cy.get('[data-cy="file-input"]')
      .attachFile('headwords_order_of_frequency.txt');
    cy.wait('@headwordsRequest');
  });
});

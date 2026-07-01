describe('Login', () => {
    beforeEach(() => {
        cy.visit('/login');
    });

    it('muestra error si se intenta ingresar con campos vacíos', () => {
        cy.get('button[type="submit"]').click();
        cy.contains('Ingresá usuario y contraseña').should('be.visible');
    });

    it('redirige a /mis-turnos tras login exitoso como paciente', () => {
        cy.intercept('POST', '**/auth/login', {
            statusCode: 200,
            body: {
                token: 'fake-jwt-token',
                rol: 'paciente',
                paciente: {
                    _id: '507f1f77bcf86cd799439011',
                    nombre: 'Juan Pérez',
                    email: 'juan@example.com',
                    nombreUsuario: 'juanperez',
                }
            }
        }).as('loginRequest');

        cy.get('#nombreUsuario').type('juanperez');
        cy.get('#password').type('password123');
        cy.get('button[type="submit"]').click();

        cy.wait('@loginRequest');
        cy.url().should('include', '/mis-turnos');
    });
});

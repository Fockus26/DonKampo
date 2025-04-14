import React from 'react'
import 'css/LegalInfo.css'

const email = 'info@donkampo.com'
const name = 'Don Kampo'
const phone = ''
const date = ''

function TermsAndConditions() {
    return (
      <div className='legal'>
        <h1>Términos y Condiciones</h1>
        <p>Última actualización: 1 de enero de 2025</p>
  
        <h2>1. Aceptación de los Términos</h2>
        <p>
          Al acceder o utilizar nuestro sitio web y servicios, usted acepta estar sujeto a estos términos y condiciones. Si no está de acuerdo con estos términos, por favor, no utilice nuestros servicios.
        </p>
  
        <h2>2. Uso del Sitio Web</h2>
        <p>
          Usted se compromete a utilizar el sitio web y los servicios proporcionados de acuerdo con las leyes y regulaciones locales aplicables. No deberá realizar ningún acto que infrinja nuestros derechos de propiedad intelectual ni cause daño a la integridad del sitio.
        </p>
  
        <h2>3. Privacidad</h2>
        <p>
          Su privacidad es importante para nosotros. Recopilamos información personal de acuerdo con nuestra política de privacidad, que puede consultar en el siguiente enlace: <a href="/privacy-politicy">Política de Privacidad</a>.
        </p>
  
        <h2>4. Modificaciones a los Términos</h2>
        <p>
          Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigencia tan pronto como sean publicadas en esta página. Se recomienda revisar regularmente esta sección para estar al tanto de cualquier cambio.
        </p>
  
        <h2>5. Contacto</h2>
        <p>
          Si tiene preguntas sobre estos términos y condiciones, no dude en contactarnos a través de nuestro correo electrónico: <a href={`mailto:${email}`}>{email}</a>.
        </p>
      </div>
    );
}

function PrivacyPoliticy() {
    return (
      <div className='legal'>
        <h1>Política de Privacidad</h1>
  
        <p>En {name}, respetamos y protegemos tu privacidad. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos tu información personal cuando accedes a nuestro sitio web y utilizas nuestros servicios.</p>
  
        <h2>Información que Recopilamos</h2>
        <p>Recopilamos información personal que nos proporcionas voluntariamente cuando te registras en nuestro sitio web, realizas una compra, o interactúas con nuestros servicios. Esto puede incluir:</p>
        <ul>
          <li>Nombre</li>
          <li>Dirección de correo electrónico</li>
          <li>Dirección de envío</li>
          <li>Información de pago</li>
          <li>Información de contacto</li>
        </ul>
  
        <h2>Cómo Usamos tu Información</h2>
        <p>Utilizamos tu información personal para los siguientes fines:</p>
        <ul>
          <li>Procesar y completar compras</li>
          <li>Proveer soporte al cliente</li>
          <li>Enviarte actualizaciones sobre productos, servicios o promociones</li>
          <li>Mejorar nuestros servicios y el sitio web</li>
        </ul>
  
        <h2>Protección de la Información</h2>
        <p>Implementamos medidas de seguridad físicas, electrónicas y administrativas para proteger tu información personal contra el acceso no autorizado, alteración o divulgación. Sin embargo, ninguna transmisión de datos por internet es completamente segura, por lo que no podemos garantizar una seguridad absoluta.</p>
  
        <h2>Cookies</h2>
        <p>Utilizamos cookies para mejorar tu experiencia en nuestro sitio web. Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo. Puedes configurar tu navegador para rechazar las cookies, pero algunas funciones del sitio pueden no funcionar correctamente.</p>
  
        <h2>Compartir Información</h2>
        <p>No vendemos ni alquilamos tu información personal a terceros. Sin embargo, podemos compartir tu información con proveedores de servicios que nos ayudan a operar el sitio web y procesar tus pedidos, siempre bajo un acuerdo de confidencialidad.</p>
  
        <h2>Tus Derechos</h2>
        <p>Tienes el derecho de acceder, corregir o eliminar tu información personal en cualquier momento. Si deseas ejercer estos derechos o tienes alguna pregunta sobre cómo tratamos tu información personal, puedes contactarnos a través de {email}.</p>
  
        <h2>Cambios a Esta Política</h2>
        <p>Nos reservamos el derecho de actualizar esta Política de Privacidad en cualquier momento. Cualquier cambio será publicado en esta página con una nueva fecha de actualización. Te recomendamos revisar esta página periódicamente para mantenerte informado sobre cómo protegemos tu información.</p>
  
        <h2>Contacto</h2>
        <p>Si tienes alguna pregunta o inquietud sobre esta Política de Privacidad, puedes contactarnos a través de:</p>
        <p>{email}</p>
        <p>{phone}</p>
  
        <p>Fecha de última actualización: {date}</p>
      </div>
    )
}

export { TermsAndConditions, PrivacyPoliticy }

/**
 * Blog Seed Script — SEO Articles for Rostro Dorado Clinic
 * 
 * Run with: node scripts/seedBlogPosts.cjs
 * 
 * Creates 4 SEO-optimized blog posts in the Firestore 'posts' collection.
 * Uses Admin Authentication to bypass security rules.
 */

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } = require("firebase/firestore");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const readline = require("readline");

const firebaseConfig = {
  apiKey: "AIzaSyBvsXf4DcWsVZvD5N9eoBfp5qRGaOfDt28",
  authDomain: "rostrodorado.com",
  projectId: "rostrodorado-80279",
  storageBucket: "rostrodorado-80279.firebasestorage.app",
  messagingSenderId: "350987427158",
  appId: "1:350987427158:web:c0a0bca7fe34f421aa8af7",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'rostrodorado-db');
const auth = getAuth(app);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const blogPosts = [
  {
    title: "¿Cuánto cuesta el Botox en Riohacha? Guía 2025",
    slug: "cuanto-cuesta-botox-riohacha",
    excerpt: "Descubre el precio real del Botox en Riohacha y La Guajira. Dra. Isaura Dorado explica qué incluye el tratamiento, cuánto dura y qué esperar en tu primera cita.",
    coverImage: "",
    author: "Dra. Isaura Dorado",
    published: true,
    views: 0,
    content: `<h2>¿Cuánto cuesta el Botox en Riohacha? Guía completa 2025</h2>

<p>Si estás buscando información sobre el precio del Botox en Riohacha, probablemente ya sabes que los costos varían mucho dependiendo de la clínica, la experiencia del médico y las zonas a tratar. En este artículo te explicamos todo lo que necesitas saber antes de tomar una decisión.</p>

<h3>¿Qué factores afectan el precio del Botox?</h3>

<p>El costo de una sesión de Botox no es fijo porque depende de varios factores:</p>

<ul>
<li><b>Zonas a tratar:</b> No es lo mismo tratar solo la frente que incluir patas de gallo y entrecejo.</li>
<li><b>Unidades necesarias:</b> Cada persona necesita una cantidad diferente según su musculatura facial.</li>
<li><b>Experiencia del médico:</b> Un especialista en medicina estética certificado cobra diferente a un médico general.</li>
<li><b>Calidad del producto:</b> El Botox original (Allergan) tiene un costo mayor que productos genéricos.</li>
</ul>

<h3>¿Cuánto dura el efecto?</h3>

<p>El Botox tiene una duración promedio de 4 a 6 meses. Después de tu primera aplicación, el efecto puede durar menos mientras tu músculo se adapta. Con sesiones regulares, muchos pacientes notan que el efecto dura más con el tiempo.</p>

<h3>¿Es seguro aplicarse Botox en Riohacha?</h3>

<p>Sí, siempre que lo realice un médico certificado en medicina estética. En Rostro Dorado Clinic, la Dra. Isaura Dorado cuenta con formación especializada en armonización facial y aplica el procedimiento en un ambiente clínico controlado.</p>

<h3>¿Qué incluye una sesión de Botox en Rostro Dorado?</h3>

<p>Cuando agendas una cita con nosotros, el proceso incluye:</p>

<ol>
<li>Valoración médica inicial sin costo</li>
<li>Análisis de tu expresión facial y zonas de tratamiento</li>
<li>Aplicación del Botox con técnica de microinyección</li>
<li>Seguimiento a los 15 días para revisar resultados</li>
</ol>

<h3>¿Cómo agendar tu cita?</h3>

<p>Puedes contactarnos directamente al <b>+57 312 619 6527</b> o a través de nuestro Instagram <a href="https://www.instagram.com/dra.isauradorado/" target="_blank" rel="noopener noreferrer nofollow" class="text-gold hover:underline">@dra.isauradorado</a> para resolver cualquier duda antes de tu primera consulta.</p>`
  },
  {
    title: "Armonización Facial en Riohacha: qué es y qué esperar",
    slug: "armonizacion-facial-riohacha",
    excerpt: "¿Qué es la armonización facial y cómo funciona? La Dra. Isaura Dorado explica el procedimiento paso a paso para pacientes en Riohacha y La Guajira.",
    coverImage: "",
    author: "Dra. Isaura Dorado",
    published: true,
    views: 0,
    content: `<h2>Armonización Facial en Riohacha: qué es, cómo funciona y qué esperar</h2>

<p>La armonización facial es uno de los tratamientos más solicitados en nuestra clínica. Sin embargo, muchos pacientes llegan con dudas sobre qué implica exactamente. Aquí te lo explicamos de forma clara.</p>

<h3>¿Qué es la armonización facial?</h3>

<p>La armonización facial es un conjunto de procedimientos médico-estéticos que buscan equilibrar las proporciones del rostro de forma natural. No se trata de cambiar cómo te ves, sino de resaltar tus rasgos propios y corregir asimetrías o pérdidas de volumen.</p>

<p>Los tratamientos más comunes dentro de la armonización facial incluyen:</p>

<ul>
<li><b>Ácido hialurónico</b> para labios, ojeras y pómulos</li>
<li><b>Botox</b> para suavizar líneas de expresión</li>
<li><b>Bioestimuladores</b> para mejorar la calidad de la piel</li>
<li><b>Rinomodelación</b> para corregir el perfil nasal sin cirugía</li>
</ul>

<h3>¿Cómo es el proceso en Rostro Dorado Clinic?</h3>

<p>En nuestra clínica en Riohacha, cada tratamiento de armonización comienza con una valoración médica completa. La Dra. Isaura Dorado analiza la estructura ósea, el tono muscular y el volumen de tejidos para diseñar un plan personalizado.</p>

<p>El procedimiento en sí es ambulatorio — no necesitas hospitalización ni anestesia general. La mayoría de los tratamientos duran entre 30 y 60 minutos, y puedes retomar tus actividades normales el mismo día.</p>

<h3>¿Duele la armonización facial?</h3>

<p>La incomodidad es mínima. Aplicamos crema anestésica tópica antes del procedimiento y usamos cánulas de punta roma para minimizar el dolor y reducir el riesgo de hematomas.</p>

<h3>¿Cuánto tiempo duran los resultados?</h3>

<p>Depende del tratamiento:</p>

<ul>
<li>Ácido hialurónico en labios: 6 a 12 meses</li>
<li>Ácido hialurónico en ojeras: 12 a 18 meses</li>
<li>Botox: 4 a 6 meses</li>
<li>Bioestimuladores: hasta 2 años</li>
</ul>

<h3>¿Quién puede hacerse armonización facial?</h3>

<p>Cualquier persona mayor de 18 años que quiera mejorar sus rasgos de forma natural. Realizamos valoración médica previa para descartar contraindicaciones como embarazo, alergias a los componentes o enfermedades autoinmunes activas.</p>`
  },
  {
    title: "Cómo cuidar la piel en el clima caluroso de La Guajira",
    slug: "cuidado-piel-clima-caluroso-guajira",
    excerpt: "El calor extremo de Riohacha afecta tu piel más de lo que crees. La Dra. Isaura Dorado te da una rutina de cuidado dermocosmético adaptada al clima guajiro.",
    coverImage: "",
    author: "Dra. Isaura Dorado",
    published: true,
    views: 0,
    content: `<h2>Cómo cuidar la piel en el clima caluroso de La Guajira</h2>

<p>Vivir en Riohacha tiene muchas ventajas, pero el clima es un desafío constante para la piel. Las altas temperaturas, la radiación UV intensa y la humedad variable aceleran el envejecimiento cutáneo y favorecen problemas como acné, manchas e hiperpigmentación.</p>

<h3>Los principales enemigos de tu piel en La Guajira</h3>

<h4>1. Radiación solar extrema</h4>
<p>La Guajira tiene uno de los índices UV más altos de Colombia, especialmente entre las 10am y las 3pm. La exposición sin protección es la principal causa de manchas, arrugas prematuras y daño celular.</p>

<h4>2. Calor y sudoración excesiva</h4>
<p>El sudor excesivo obstruye los poros y favorece la aparición de acné y foliculitis. Si usas maquillaje o cremas muy oclusivas, el problema se agrava.</p>

<h4>3. Deshidratación cutánea</h4>
<p>Paradójicamente, la piel en climas húmedos y calurosos puede deshidratarse con facilidad si no se usa el hidratante adecuado.</p>

<h3>Rutina básica recomendada para clima caluroso</h3>

<h4>Mañana:</h4>
<ol>
<li>Limpieza suave con gel o espuma (no jabón de barra)</li>
<li>Sérum antioxidante con vitamina C</li>
<li>Hidratante ligero (gel o emulsión, no crema densa)</li>
<li>Protector solar SPF 50+ de amplio espectro — esto es innegociable</li>
</ol>

<h4>Noche:</h4>
<ol>
<li>Doble limpieza si usaste protector solar o maquillaje</li>
<li>Tónico equilibrador</li>
<li>Sérum o crema con retinol (solo en la noche, empieza 2 veces por semana)</li>
<li>Hidratante nutritivo</li>
</ol>

<h3>Productos que recomendamos</h3>

<p>En nuestra <a href="/productos" class="text-gold hover:underline font-bold">tienda dermocosmética online</a> encontrarás productos seleccionados por la Dra. Isaura Dorado específicamente para pieles que viven en climas tropicales: protectores solares ligeros, sérums antioxidantes y cremas hidratantes sin aceites comedogénicos.</p>

<h3>¿Cuándo consultar a un especialista?</h3>

<p>Si tienes manchas que no mejoran con el protector solar, acné persistente o notas cambios en la textura de tu piel, es momento de una valoración dermocosmética profesional. En Rostro Dorado Clinic ofrecemos diagnóstico de piel y planes de tratamiento personalizados.</p>`
  },
  {
    title: "Ácido Hialurónico en Labios: guía completa Riohacha",
    slug: "acido-hialuronico-labios-riohacha",
    excerpt: "Todo sobre el relleno de labios con ácido hialurónico en Riohacha. La Dra. Isaura Dorado explica el procedimiento, duración, cuidados y preguntas frecuentes.",
    coverImage: "",
    author: "Dra. Isaura Dorado",
    published: true,
    views: 0,
    content: `<h2>Ácido Hialurónico en Labios: guía completa para pacientes en Riohacha</h2>

<p>El relleno de labios con ácido hialurónico es uno de los tratamientos más populares en Rostro Dorado Clinic. Si estás considerando realizarlo, aquí encontrarás todo lo que necesitas saber antes de tu cita.</p>

<h3>¿Qué es el ácido hialurónico?</h3>

<p>El ácido hialurónico es una sustancia que el propio cuerpo produce de forma natural. Con el tiempo, su producción disminuye, lo que contribuye a la pérdida de volumen y la aparición de arrugas. Al inyectarlo en los labios, restaura volumen, define el contorno y mejora la hidratación del tejido.</p>

<h3>¿Qué resultados puedo esperar?</h3>

<p>Los resultados dependen del objetivo de cada paciente:</p>

<ul>
<li><b>Volumen:</b> labios más llenos y proyectados</li>
<li><b>Definición:</b> contorno más marcado y simétrico</li>
<li><b>Hidratación:</b> labios con mejor textura y apariencia natural</li>
<li><b>Corrección de asimetrías:</b> equilibrar diferencias entre labio superior e inferior</li>
</ul>

<p>En Rostro Dorado siempre buscamos resultados naturales. El objetivo no es hacer labios que "se noten", sino labios que te favorezcan.</p>

<h3>¿Cómo es el procedimiento?</h3>

<ol>
<li>Valoración médica y diseño del tratamiento</li>
<li>Aplicación de crema anestésica (20 minutos)</li>
<li>Infiltración del ácido hialurónico con aguja o cánula</li>
<li>Masaje modelador</li>
<li>Revisión del resultado inmediato</li>
</ol>

<p>El procedimiento completo dura aproximadamente 45 minutos.</p>

<h3>Cuidados después del tratamiento</h3>

<p>Las primeras 24-48 horas son las más importantes:</p>

<ul>
<li>No toques ni masajees los labios</li>
<li>Evita el calor extremo (sol directo, sauna, ejercicio intenso)</li>
<li>No uses lápiz labial ni maquillaje en la zona</li>
<li>Mantente hidratada — toma agua con frecuencia</li>
<li>Es normal una leve inflamación los primeros 2-3 días</li>
</ul>

<h3>¿Cuánto dura el resultado?</h3>

<p>En los labios, el ácido hialurónico dura entre 6 y 12 meses dependiendo del metabolismo de cada paciente y del producto utilizado. En climas cálidos como el de Riohacha, el metabolismo tiende a ser más activo, por lo que algunas pacientes necesitan retoque antes de los 12 meses.</p>

<h3>Preguntas frecuentes</h3>

<p><b>¿Se puede revertir si no me gusta?</b><br/>
Sí. El ácido hialurónico se puede disolver con hialuronidasa en caso de que no estés satisfecha con el resultado.</p>

<p><b>¿Duele?</b><br/>
Con la anestesia tópica, la mayoría de las pacientes describen la sensación como un pellizco leve.</p>

<p><b>¿Puedo volar después del tratamiento?</b><br/>
Recomendamos esperar al menos 48 horas antes de tomar un vuelo largo.</p>

<p><b>¿Cuándo veré el resultado final?</b><br/>
El resultado final se aprecia a los 15 días, una vez que baje la inflamación y el producto se integre al tejido.</p>

<p><i>¿Tienes más preguntas? Escríbenos al <b>+57 312 619 6527</b> o visítanos en Riohacha, La Guajira.</i></p>`
  }
];

async function seedBlogPosts() {
  console.log("🌱 Seeding 4 SEO blog posts into Firestore...\n");
  const email = 'isauradorado@rostrodorado.com';

  await new Promise((resolve, reject) => {
    rl.question(`🔑 Ingrese la contraseña de administrador para ${email}: `, async (password) => {
      try {
        console.log("Autenticando...");
        await signInWithEmailAndPassword(auth, email, password);
        console.log("✅ Autenticación exitosa.\n");
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });

  for (const post of blogPosts) {
    const q = query(collection(db, 'posts'), where('slug', '==', post.slug));
    const existing = await getDocs(q);

    if (!existing.empty) {
      console.log(`⏭️  Skipped "${post.title}" — slug "${post.slug}" already exists.`);
      continue;
    }

    await addDoc(collection(db, 'posts'), {
      ...post,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`✅ Created: "${post.title}"`);
  }

  console.log("\n🎉 Blog seed complete!");
  process.exit(0);
}

seedBlogPosts().catch(err => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});

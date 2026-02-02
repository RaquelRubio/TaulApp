# Recetas – TaulApp

Este documento contiene las recetas fuente de TaulApp.  
Aquí se redactan en formato humano, claro y narrado, antes de transformarlas automáticamente a JSON.

---

## 📌 Reglas generales

### Estructura obligatoria de cada receta
Todas las recetas deben incluir, en este orden:

1. id único (slug)
2. nombre
3. nacionalidad
4. tiempo aproximado (en minutos)
5. tags
6. ingredientes (con cantidades)
7. pasos
8. modo de conservación
9. notas (opcional)

---

### Ingredientes
- Las cantidades están pensadas para **1 ración**
- Cada ingrediente se escribe como:
  - `Ingrediente – cantidad unidad`
- Ejemplos:
  - `Harina – 100 g`
  - `Huevo – 1 ud`
  - `Sal – al gusto`
- “Al gusto” se usa cuando no tiene sentido una cantidad exacta

---

### Pasos
- Los pasos deben ser **narrados y claros**
- No se repiten cantidades ya indicadas en los ingredientes
  - ❌ “Pela 1/2 diente de ajo”
  - ✅ “Pela el diente de ajo”
- Solo se indican fracciones cuando un ingrediente se usa en varios momentos
  - ej.: “añade la mitad de la harina”, “incorpora el resto”
- Se pueden incluir:
  - tipo de corte (dados, juliana, etc.)
  - tiempos aproximados
  - textura o punto final (“hasta que esté cremoso”, “hasta que esté dorado”)
- No usar unidades ni cantidades numéricas en los pasos (excepto tiempos)

---

### Modo de conservación
- Texto libre y práctico
- Indicar:
  - dónde se conserva (nevera, congelador, temperatura ambiente)
  - cuánto tiempo aproximado
  - consejos útiles (recipiente hermético, remover antes de servir, etc.)

---

### Notas
- Consejos adicionales
- Variantes
- Sustituciones
- Aclaraciones (batch cooking, etc.)

---

## 🥘 Recetas

### 🍽️ Hummus clásico
**id:** hummus-clasico  
**nacionalidad:** arabe  
**tiempo:** 10  
**tags:** vegano, halal, sin_gluten  

**Ingredientes (1 ración):**
- Garbanzos cocidos – 150 g
- Tahini – 1 cda
- Limón – 1/2
- Ajo – 1/2 diente
- Aceite de oliva – 1 cda
- Sal – al gusto

**Pasos:**
1. **Prepara el ajo y el limón.** Pela el diente de ajo. Exprime el limón y reserva el zumo.
2. **Tritura la base.** En una batidora o robot, añade los garbanzos cocidos, el tahini, el zumo de limón y el ajo. Tritura durante unos segundos, hasta que se integren.
3. **Ajusta la textura.** Con la batidora en marcha, añade el aceite de oliva poco a poco. Sigue triturando hasta obtener una textura cremosa.  
   - Si queda demasiado espeso, añade un poco de agua o del líquido de los garbanzos y vuelve a triturar.
4. **Sazona y prueba.** Añade sal al gusto. Prueba y ajusta si es necesario.
5. **Sirve.** Pásalo a un bol y, si quieres, termina con un chorrito extra de aceite de oliva.

**Modo de conservación:**
- Conservar en la nevera en un recipiente hermético.
- Aguanta bien entre 3 y 4 días.
- Antes de servir, remover y añadir un poco de aceite de oliva si se ha espesado.

**Notas:**
- Se puede hacer sin tahini si no se encuentra; queda más suave y menos intenso.
- Apto para batch cooking.

---

### 🍽️ Gazpacho andaluz
**id:** gazpacho-andaluz  
**nacionalidad:** española  
**tiempo:** 15  
**tags:** vegano, halal, kosher, sin_gluten, sin_lactosa  

**Ingredientes (1 ración):**
- Tomate pera – 250 g
- Pepino – 1/4 ud
- Pimiento verde – 1/4 ud
- Ajo – 1/4 diente
- Pan del día anterior – 15 g
- Aceite de oliva virgen extra – 25 ml
- Vinagre de Jerez – 1/2 cda
- Sal – al gusto
- Agua fría – al gusto

**Pasos:**
1. **Prepara las verduras.** Lava bien el tomate, el pepino y el pimiento. Pela el pepino si la piel es gruesa.
2. **Trocea.** Corta el tomate, el pepino y el pimiento en trozos medianos, lo justo para que se puedan triturar fácilmente.
3. **Añade el ajo y el pan.** Incorpora el ajo y el pan troceado a las verduras.
4. **Tritura.** Tritura todo hasta obtener una mezcla homogénea.
5. **Emulsiona.** Con la batidora en marcha, añade el aceite de oliva poco a poco para que el gazpacho quede ligado y cremoso.
6. **Ajusta el sabor.** Añade el vinagre y la sal. Si queda muy espeso, incorpora un poco de agua fría hasta alcanzar la textura deseada.
7. **Enfría.** Lleva a la nevera y deja enfriar antes de servir.

**Modo de conservación:**
- Conservar en la nevera en un recipiente bien cerrado.
- Aguanta hasta 48 horas.
- Remover antes de servir.

**Notas:**
- Servir muy frío.
- El pan debe ser preferiblemente del día anterior.

---

### 🍽️ Curry de lentejas rojas
**id:** curry-lentejas-rojas  
**nacionalidad:** india  
**tiempo:** 30  
**tags:** vegano, halal, sin_gluten, sin_lactosa  

**Ingredientes (1 ración):**
- Lentejas rojas – 80 g
- Cebolla – 1/4 ud
- Ajo – 1/2 diente
- Jengibre fresco – 5 g
- Tomate triturado – 100 g
- Leche de coco – 100 ml
- Aceite vegetal – 1 cda
- Curry en polvo – 1 cdita
- Comino molido – 1/2 cdita
- Cúrcuma – 1/2 cdita
- Sal – al gusto
- Agua – al gusto

**Pasos:**
1. **Prepara los aromáticos.** Pela y pica la cebolla en dados pequeños. Pela y ralla el ajo y el jengibre.
2. **Sofríe la base.** En una olla o sartén amplia, calienta el aceite a fuego medio y sofríe la cebolla hasta que esté blanda y ligeramente dorada.
3. **Añade las especias.** Incorpora el ajo, el jengibre, el curry, el comino y la cúrcuma. Remueve durante unos segundos, hasta que desprendan aroma.
4. **Cuece las lentejas.** Añade las lentejas rojas y el tomate triturado. Cubre con agua y deja cocinar a fuego medio.
5. **Añade la leche de coco.** Cuando las lentejas estén tiernas, incorpora la leche de coco y mezcla bien.
6. **Ajusta la textura.** Cocina unos minutos más, removiendo, hasta obtener un curry cremoso. Ajusta de sal si es necesario.
7. **Sirve.** Retira del fuego cuando tenga la consistencia deseada.

**Modo de conservación:**
- Conservar en la nevera en un recipiente hermético.
- Aguanta bien 3 días.
- Al recalentar, añadir un poco de agua si se ha espesado.

**Notas:**
- Se puede acompañar con arroz basmati.
- Ideal para batch cooking.

---

### 🍽️ Tajine de pollo con limón
**id:** tajine-pollo-limon  
**nacionalidad:** marroquí  
**tiempo:** 50  
**tags:** halal, sin_lactosa  

**Ingredientes (1 ración):**
- Pollo (muslo o contramuslo) – 200 g
- Cebolla – 1/2 ud
- Ajo – 1 diente
- Limón – 1/2 ud
- Aceite de oliva – 1 cda
- Comino molido – 1/2 cdita
- Jengibre molido – 1/2 cdita
- Cúrcuma – 1/2 cdita
- Pimienta negra – al gusto
- Sal – al gusto
- Agua o caldo – al gusto

**Pasos:**
1. **Prepara los ingredientes.** Pela y corta la cebolla en juliana fina. Pela y machaca el ajo. Lava el limón y córtalo en rodajas finas.
2. **Dora el pollo.** En una cazuela o tajine, calienta el aceite y dora el pollo por todos los lados hasta que esté ligeramente dorado.
3. **Añade la base.** Incorpora la cebolla y el ajo al pollo. Cocina a fuego medio hasta que la cebolla esté blanda.
4. **Incorpora las especias.** Añade el comino, el jengibre, la cúrcuma, la pimienta y la sal. Remueve para que el pollo se impregne bien.
5. **Cuece a fuego lento.** Añade el limón y un poco de agua o caldo. Tapa y deja cocinar a fuego suave hasta que el pollo esté tierno.
6. **Reduce la salsa.** Destapa y deja cocinar unos minutos más, hasta que la salsa se reduzca ligeramente.

**Modo de conservación:**
- Conservar en la nevera en un recipiente cerrado.
- Aguanta 2–3 días.
- Recalentar a fuego suave.

**Notas:**
- Se puede acompañar con cuscús o arroz.
- El sabor mejora de un día para otro.

---

### 🇪🇸 Tortilla de patatas
**id:** tortilla-patatas  
**nacionalidad:** española  
**tiempo:** 25  
**tags:** vegetariano, sin_gluten  

**Ingredientes (1 ración):**
- Patata – 250 g
- Huevo – 2 ud
- Cebolla – 50 g
- Aceite de oliva – al gusto
- Sal – al gusto

**Pasos:**
1. **Prepara las patatas y la cebolla.** Pela las patatas y córtalas en rodajas finas. Pela la cebolla y córtala en juliana.
2. **Fríe las patatas.** Calienta abundante aceite de oliva en una sartén a fuego medio y añade las patatas. Cocina despacio hasta que estén tiernas, sin dorarlas en exceso.
3. **Añade la cebolla.** Incorpora la cebolla a la sartén y cocina unos minutos más, hasta que esté blanda.
4. **Bate los huevos.** En un bol, bate los huevos con una pizca de sal.
5. **Mezcla.** Escurre bien las patatas y la cebolla y añádelas al bol con los huevos. Mezcla con cuidado.
6. **Cuaja la tortilla.** Vierte la mezcla en una sartén con un poco de aceite caliente. Cuaja a fuego medio por un lado, dale la vuelta y termina de cuajar al punto deseado.

**Modo de conservación:**
- Conservar en la nevera en un recipiente cerrado.
- Aguanta 2 días.
- Sacar unos minutos antes de servir.

**Notas:**
- Se puede hacer sin cebolla.
- Mejor con patatas harinosas.

---

### 🇪🇸 Ensaladilla rusa
**id:** ensaladilla-rusa  
**nacionalidad:** española  
**tiempo:** 30  
**tags:** sin_gluten  

**Ingredientes (1 ración):**
- Patata – 200 g
- Zanahoria – 50 g
- Huevo – 1 ud
- Atún en conserva – 40 g
- Mayonesa – al gusto
- Sal – al gusto

**Pasos:**
1. **Cuece las verduras.** Pela las patatas y la zanahoria y cuécelas en agua con sal hasta que estén tiernas.
2. **Cuece el huevo.** Cuece el huevo en agua durante unos minutos hasta que esté duro.
3. **Trocea.** Deja templar y corta las patatas, la zanahoria y el huevo en dados pequeños.
4. **Mezcla.** En un bol, mezcla las verduras, el huevo y el atún desmenuzado.
5. **Añade la mayonesa.** Incorpora la mayonesa poco a poco hasta conseguir una mezcla cremosa.
6. **Ajusta de sal.** Prueba y rectifica si es necesario.

**Modo de conservación:**
- Conservar en la nevera bien tapada.
- Consumir en un máximo de 48 horas.

**Notas:**
- Se puede añadir aceitunas o guisantes.
- Servir bien fría.

---

### 🍽️ Salmorejo cordobés
**id:** salmorejo-cordobes  
**nacionalidad:** española  
**tiempo:** 10  
**tags:** vegetariano, sin_gluten  

**Ingredientes (1 ración):**
- Tomate pera – 300 g
- Pan del día anterior – 40 g
- Aceite de oliva virgen extra – 40 ml
- Ajo – 1/2 diente
- Sal – al gusto

**Pasos:**
1. **Prepara los ingredientes.** Lava los tomates y córtalos en trozos grandes.
2. **Tritura la base.** Tritura los tomates junto con el ajo hasta obtener una mezcla fina.
3. **Añade el pan.** Incorpora el pan troceado y deja que se empape unos minutos.
4. **Emulsiona.** Tritura de nuevo y añade el aceite poco a poco hasta obtener una textura espesa y cremosa.
5. **Ajusta.** Añade sal al gusto y vuelve a triturar brevemente.

**Modo de conservación:**
- Conservar en la nevera bien tapado.
- Aguanta 2–3 días.
- Remover antes de servir.

**Notas:**
- Tradicionalmente se sirve con huevo duro y jamón.
- Servir muy frío.

---

### 🇪🇸 Lentejas estofadas
**id:** lentejas-estofadas  
**nacionalidad:** española  
**tiempo:** 45  
**tags:** vegano, sin_gluten, sin_lactosa  

**Ingredientes (1 ración):**
- Lentejas pardinas – 80 g
- Cebolla – 1/4 ud
- Zanahoria – 50 g
- Pimiento verde – 1/4 ud
- Ajo – 1/2 diente
- Aceite de oliva – 1 cda
- Pimentón dulce – 1/2 cdita
- Hoja de laurel – 1 ud
- Sal – al gusto
- Agua – al gusto

**Pasos:**
1. **Prepara las verduras.** Pela y corta la cebolla, la zanahoria y el pimiento en dados pequeños. Pela y pica el ajo.
2. **Sofríe la base.** Calienta el aceite en una olla y sofríe las verduras a fuego medio hasta que estén blandas.
3. **Añade el pimentón.** Incorpora el pimentón, remueve rápidamente para que no se queme.
4. **Cuece las lentejas.** Añade las lentejas, el laurel y cubre con agua. Cocina a fuego medio hasta que estén tiernas.
5. **Ajusta.** Añade sal al final y deja reposar unos minutos antes de servir.

**Modo de conservación:**
- Conservar en la nevera en un recipiente hermético.
- Aguanta 3 días.
- Al recalentar, añadir un poco de agua si espesan.

**Notas:**
- El sabor mejora de un día para otro.
- Se pueden añadir especias al gusto.


### 🍽️ (Nueva receta)
**id:**  
**nacionalidad:**  
**tiempo:**  
**tags:**  

**Ingredientes (1 ración):**
- 

**Pasos:**
1. 
2. 
3. 

**Modo de conservación:**
- 

**Notas:**
-

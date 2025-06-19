import React from 'react';
// Remove unused imports related to old props
// import type { Agent, MapArea, Utility } from '../../types/index';
// import type { imageMap as imageMapValue } from '../../types/index';

// Define props based on the MapSvgComponent type
interface SvgComponentProps {
	className?: string; // Keep className for styling
	newBuildFrom: () => React.ReactNode; // Function to render 'from' areas
	newBuildTo: () => React.ReactNode; // Function to render 'to' areas
}

// Destructure the new props and remove the old ones
const SvgComponent = ({ className, newBuildFrom, newBuildTo }: SvgComponentProps): React.JSX.Element => (
	// Apply className passed from parent for positioning/scaling
	<svg className={className} fill='none' height={860} viewBox='0 0 804 860' width={804} xmlns='http://www.w3.org/2000/svg'>
		<g id='Ascent'>
			{/* Keep the base map paths */}
			<path clipRule='evenodd' d='M53.9351 168H2V263H54.9338V252H59.9276V305H227.718V310H129.84V411H136.831V416H125.845V544H220.727V758H278.654V858H313.611L333.586 835L335.583 827H368.542V736H490.889H514.36V717H567.293V652H554.31V612H556.307H634.21V440H614.235V433H742.075V420H760.052V433H802V393H725.096V362H773.036V175H638.205V97H543.323V86H503.373V97H497.381V2H382.524V99H213.735V150H227.718V157H59.9276V181H54.9338V168H53.9351ZM58.9288 194H54.9338V236H55.9326H58.9288V194ZM257.68 192H291.638V221H297.63V208H366.544V214H381.526V150H308.617V130H284.647V150H253.685V157H257.68V192ZM540.327 214V130H606.245V176H560.302V209H576.781V214H560.302H540.327ZM529.341 358V369H439.453V365H399.503V363H439.453V310H412.487V272H445.446V225H419.478L408.492 214V201L419.478 190H470.414V150H497.381V132H503.373V247H553.311V298H571.288V303H514.36V358H529.341ZM631.214 298H644.197V214H688.142V207H604.247V209H589.266V214H598.255V234L613.236 254V298H593.261V303H625.221V318H631.214V298ZM264.672 434H226.719V416H160.801V411H169.79V356H206.744V376H277.655V310H253.685V305H270.664V276H291.638V241H297.63V285H343.573L364.547 265L366.544 263V308V310H337.581V363H377.531V365H337.581V416H334.584H264.672V434ZM625.221 342H631.214V362H693.136V393H614.235V375H580.277V433H589.266V440H567.293V554H479.403V399H510.365V419H561.301V369H547.318V358H625.221V342ZM284.647 460H257.68V632H348.567V626H418.479V652H520.352V601H418.479V504L405.496 491H337.581V460H334.584V484H332.587H284.647V460Z' fill='#7E7F7E' fillRule='evenodd' id='Exclude' />
			<g id='a/b sites'>
				<path clipRule='evenodd' d='M645.196 214H760.052V228H773.036L773.036 214V292L773.036 277H760.052V292H645.196V214ZM741.076 249H728.092V246H715.109V260H728.092V263H741.076V249ZM677.156 240H664.172V279H677.156V240Z' fill='#A5A389' fillRule='evenodd' id='a' />
				<path clipRule='evenodd' d='M169.79 263L169.79 157H137.83V168H122.849V157H61.5L61.5724 276H156.806V263H169.79ZM116.856 221V214.5V214H105.87V225.5L107.868 229.5V241H121.351V225.5L116.856 221Z' fill='#A5A389' fillRule='evenodd' id='b' />
			</g>
			<g id='boxes and stuff'>
				<rect fill='#7E7F7E' height={23} id='Rectangle 140' width={4} x={332} y={460} />
				<path d='M623.223 534.912V541.912' id='Vector 371' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M634.21 542H616.232' id='Vector 372' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M622.724 440V453H634.21' id='Vector 368' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M628.217 439.912V447.912H634.21' id='Vector 369' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M200.752 216L195.758 209L189.765 216V252H200.752V216Z' id='Vector 351' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M48.9404 263.001C47.3772 258.531 46.5521 250.744 55.9317 257.001' id='Vector 353' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M277.655 213H259.678V258H290.639' id='Vector 355' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M270.664 261H290.639' id='Vector 356' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M271.663 298C266.441 295.859 257.407 293.866 263.673 305' id='Vector 357' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M306.619 129.912L383.523 130' id='Vector 358' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M433.461 272V261H445.446' id='Vector 359' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M439.453 261V254H446.444' id='Vector 360' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M540.327 201H530.34V212V214H541.326' id='Vector 361' stroke='#A3A8A3' strokeWidth={3} />
				<ellipse cx={437.955} cy={82.5} id='Ellipse 20' rx={6.49189} ry={6.5} stroke='#A3A8A3' strokeWidth={3} />
				<rect height={13} id='Rectangle 72' stroke='#A3A8A3' strokeWidth={3} width={12.9838} x={760.052} y={194} />
				<path d='M760 215.5H773L773.036 228H760.052L760 215.5Z' id='Rectangle 73' stroke='#A3A8A3' strokeWidth={3} />
				<rect height={15} id='Rectangle 74' stroke='#A3A8A3' strokeWidth={3} width={12.9838} x={760.052} y={277} />
				<rect height={24} id='Rectangle 78' stroke='#A3A8A3' strokeWidth={3} width={15.98} x={746.07} y={338} />
				<path d='M603.248 298V292.995C603.248 290.789 605.037 289 607.243 289V289C609.45 289 611.238 290.789 611.238 292.995V298' id='Vector 378' stroke='#A3A8A3' strokeWidth={3} />
				<rect height={24} id='Rectangle 79' stroke='#A3A8A3' strokeWidth={3} width={10.9863} x={762.05} y={338} />
				<rect height={14} id='Rectangle 75' stroke='#A3A8A3' strokeWidth={3} width={12.9838} x={728.092} y={249} />
				<rect height={14} id='Rectangle 76' stroke='#A3A8A3' strokeWidth={3} width={12.9838} x={715.109} y={246} />
				<rect height={39} id='Rectangle 77' stroke='#A3A8A3' strokeWidth={3} width={12.9838} x={664.172} y={240} />
				<path d='M577.281 214H588.767' id='Vector 364' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M570.29 214V227.5H598.255' id='Vector 365' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M598.255 234H589.765V227.5' id='Vector 366' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M567.793 298V260M598.754 298V260' id='Vector 367' stroke='#A3A8A3' strokeWidth={3} />
				<rect height={11} id='Rectangle 80' stroke='#A3A8A3' strokeWidth={3} width={11.985} x={567.293} y={493} />
				<path d='M634.21 543.912H615.746M614.235 543.912H615.746M615.746 543.912C615.746 542.757 615.746 537.653 615.746 535.245H622.927V530.912H634.21' id='Vector 370' stroke='#A3A8A3' strokeWidth={3} />
				<rect height={14} id='Rectangle 81' stroke='#A3A8A3' strokeWidth={3} width={10.9863} x={479.403} y={554} />
				<rect height={14} id='Rectangle 82' stroke='#A3A8A3' strokeWidth={3} width={14.9813} x={418.479} y={554} />
				<path d='M418.479 553H452.936V466H420.976' id='Vector 373' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M420.976 433H452.936V369' id='Vector 374' stroke='#A3A8A3' strokeWidth={3} />
				<rect height={14} id='Rectangle 83' stroke='#A3A8A3' strokeWidth={3} width={11.985} x={454.434} y={369} />
				<ellipse cx={322.1} cy={683.5} id='Ellipse 21' rx={9.48814} ry={9.5} stroke='#A3A8A3' strokeWidth={3} />
				<ellipse cx={258.18} cy={747.5} id='Ellipse 22' rx={10.4869} ry={10.5} stroke='#A3A8A3' strokeWidth={3} />
				<rect height={26} id='Rectangle 84' stroke='#A3A8A3' strokeWidth={3} width={23.97} x={125.845} y={465} />
				<rect height={14} id='Rectangle 85' stroke='#A3A8A3' strokeWidth={3} width={10.9863} x={382.524} y={476.912} />
				<path d='M394.509 490.912L394.509 475.912' id='Vector 375' stroke='#A3A8A3' strokeWidth={3} />
				<ellipse cx={388.017} cy={449.5} id='Ellipse 23' rx={5.49313} ry={5.5} stroke='#A3A8A3' strokeWidth={3} />
				<rect height={13} id='Rectangle 86' stroke='#A3A8A3' strokeWidth={3} width={10.9863} x={355.558} y={365} />
				<rect height={6} id='Rectangle 87' stroke='#A3A8A3' strokeWidth={3} width={11.985} x={353.561} y={358} />
				<rect height={15} id='Rectangle 88' stroke='#A3A8A3' strokeWidth={3} width={9.98752} x={337.581} y={349} />
				<rect height={13} id='Rectangle 89' stroke='#A3A8A3' strokeWidth={3} width={12.9838} x={156.806} y={263} />
				<path d='M121.351 225.5L116.856 221V214.5V214H105.87V225.5M121.351 225.5H124.347M121.351 225.5V241H107.868V229.5L105.87 225.5M105.87 225.5H103.373' id='Vector 376' stroke='#A3A8A3' strokeWidth={3} />
				<rect height={11} id='Rectangle 95' stroke='#A3A8A3' strokeWidth={3} width={14.9813} x={122.849} y={157} />
				<path d='M169.79 276V183H200.752H201.75' id='Vector 342' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M145.82 276H144.821' id='Vector 343' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M59.9276 276H200.752H201.75' id='Vector 341' stroke='#A3A8A3' strokeWidth={3} />
				<path d='M514.36 716.912H490.39V735.912' id='Vector 481' stroke='#A3A8A3' strokeWidth={3} />
				<circle cx={464.5} cy={153} fill='#A3A8A3' id='Ellipse 31' r={1.5} />
				<circle cx={467.5} cy={153} fill='#A3A8A3' id='Ellipse 32' r={1.5} />
				<circle cx={467.5} cy={156} fill='#A3A8A3' id='Ellipse 33' r={1.5} />
			</g>
			<g id='ab text'>
				<g id='Vector'>
					<path d='M77.3492 214.001V179.092H90.6961C93.2157 179.092 95.3097 179.49 96.978 180.285C98.6578 181.069 99.9119 182.143 100.74 183.507C101.58 184.87 102 186.416 102 188.143C102 189.563 101.728 190.779 101.183 191.791C100.638 192.791 99.9062 193.603 98.9869 194.228C98.0676 194.853 97.0405 195.302 95.9055 195.575V195.916C97.1426 195.984 98.3286 196.365 99.4636 197.058C100.61 197.74 101.546 198.705 102.273 199.955C102.999 201.205 103.362 202.717 103.362 204.49C103.362 206.296 102.925 207.921 102.051 209.365C101.177 210.796 99.8608 211.927 98.1016 212.757C96.3425 213.586 94.1293 214.001 91.4622 214.001H77.3492ZM83.6651 208.717H90.4578C92.7504 208.717 94.4017 208.279 95.4118 207.404C96.4333 206.518 96.944 205.382 96.944 203.995C96.944 202.961 96.6886 202.029 96.1779 201.2C95.6672 200.359 94.9408 199.7 93.9988 199.222C93.0568 198.734 91.9332 198.49 90.628 198.49H83.6651V208.717ZM83.6651 193.938H89.913C91.0026 193.938 91.9843 193.74 92.8582 193.342C93.7321 192.933 94.4187 192.359 94.9181 191.62C95.4288 190.87 95.6842 189.984 95.6842 188.961C95.6842 187.609 95.2075 186.495 94.2542 185.62C93.3122 184.745 91.9105 184.308 90.0492 184.308H83.6651V193.938Z' fill='#605F50' />
					<path d='M686.071 277.001H679.33L691.604 242.092H699.401L711.693 277.001H704.951L695.639 249.251H695.366L686.071 277.001ZM686.293 263.313H704.679V268.393H686.293V263.313Z' fill='#605F50' />
				</g>
			</g>
			<g id='map outlines'>
				<path d='M60 194H54.9338V236H55.9326H60V194Z' id='Vector 340' stroke='#E3E7ED' strokeWidth={3} />
				<g id='map outlines_2'>
					<path d='M381.526 150H308.617V130H284.647V150H253.685V157H257.68V192H291.638V221H297.63V208H366.544V222V214H381.526V150ZM381.526 150H430.464' id='Vector 344' stroke='#E3E7ED' strokeWidth={3} />
					<path d='M540.327 130V214H560.302H576.782V209H560.302V176H606.245V130H540.327Z' id='Vector 345' stroke='#E3E7ED' strokeWidth={3} />
					<path d='M439.453 363V310H412.487V272H445.446V225H419.478L408.492 214V201L419.478 190H470.414V150H459.428H497.381V132H503.373V247H553.311V298H571.288V303H514.36V358H529.341V369H439.453V365M439.453 363H399.503V365H439.453M439.453 363V365' id='Vector 346' stroke='#E3E7ED' strokeWidth={3} />
					<path d='M644.197 298H631.213V318H625.221V303H593.261V298H613.236V254L598.255 234V214H589.266V209H604.247V207H688.142V214H644.197V298Z' id='Vector 347' stroke='#E3E7ED' strokeWidth={3} />
					<path d='M631.214 342H625.221V358H547.318V369H561.301V419H510.365V399H479.403V554H567.293V440H589.266V433H580.277V375H614.235V393H693.136V362H631.214V342Z' id='Vector 349' stroke='#E3E7ED' strokeWidth={3} />
					<path d='M284.647 460H257.68V632H348.567V626H418.479V652H520.352V601H418.479V504L405.496 491H337.581V460H337.5V484H332.587H284.647V460Z' id='Vector 350' stroke='#E3E7ED' strokeWidth={3} />
					<path d='M554.31 612V584H556.307V612M554.31 612H556.307M554.31 612V652H567.293V717H514.36V736H490.889H368.542V827H335.583L333.586 835L313.61 858H278.654V758H220.727V544H125.845V416H136.831V411H129.84V310H227.718V305H59.9276V252H54.9338V263H2V168H53.9351H54.9338V181H59.9276V157H227.718V150H213.735V99H382.524V2H497.381V97H503.373V86H543.323V97H638.205V175H773.036V362H725.096V393H802V433H760.052V420H742.075V433H614.235V440H634.21V612H556.307' id='Map Outlines' stroke='#E3E7ED' strokeWidth={3} />
				</g>
				<path d='M337.581 438V416M337.581 416V365M337.581 416H264.672V434H226.719V416H160.801V411H169.79V356H206.744V376H277.655V310H253.685V305H270.664V276H291.638V241H297.63V285H343.573L364.547 265L366.544 263V252V308V310H337.581V363M337.581 363H377.531V365H337.581M337.581 363V365' id='Vector 348' stroke='#E3E7ED' strokeWidth={3} />
			</g>

			{/* Call the functions passed as props to render the areas */}
			{newBuildFrom()}
			{newBuildTo()}
		</g>
	</svg>
);
export default SvgComponent;

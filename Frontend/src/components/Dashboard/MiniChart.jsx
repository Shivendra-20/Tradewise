export default function MiniChart({ positive }) {

return (

<svg
viewBox="0 0 200 60"
className="w-full h-16 mt-4"
>

<path

d="M0 45
L20 42
L40 30
L60 36
L80 18
L100 22
L120 15
L140 20
L160 10
L180 16
L200 8"

fill="none"

stroke={positive ? "#22c55e" : "#ef4444"}

strokeWidth="3"

strokeLinecap="round"

/>

</svg>

);

}
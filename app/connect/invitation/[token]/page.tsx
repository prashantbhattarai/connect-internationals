import InvitationLanding from "../../../components/InvitationLanding";
export const dynamic="force-dynamic";
export const metadata={referrer:"no-referrer"};
export default function InvitationPage({params}:{params:{token:string}}){return <InvitationLanding token={params.token}/>;}

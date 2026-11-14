import { Card, Label } from "../../ui/kit";
import { HubIcon } from "../icons";
import { leaveHub } from "../HubApp";

/** Phone "More" tab: the alpha tools, and the way back to the alpha layout. */
export default function More({ pages }: { pages: { k: string; l: string; sub: string }[] }) {
  return (
    <div className="stack">
      <Card pad={false} className="pad-t">
        <div className="pad-x"><Label>Tools</Label></div>
        <ul className="list">
          {pages.map((p) => (
            <li key={p.k}>
              <a className="list-btn" href={"#/" + p.k}>
                <HubIcon name={p.k} />
                <span className="li-mid"><span>{p.l}</span><span className="muted small">{p.sub}</span></span>
                <span className="muted" aria-hidden="true">›</span>
              </a>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <Label>Preview</Label>
        <p className="small muted">The finance hub is a preview behind a switch. The alpha app is unchanged and one tap away.</p>
        <button type="button" className="btn" onClick={leaveHub}>Back to alpha</button>
      </Card>
    </div>
  );
}

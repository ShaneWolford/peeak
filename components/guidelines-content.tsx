"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export function GuidelinesContent() {
  return (
    <div className="container max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Peeak Community Guidelines</CardTitle>
          <CardDescription>
            By using Peeak, you agree to follow these rules and respect others on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6 text-sm leading-relaxed">
              <section>
                <p className="text-muted-foreground">
                  Welcome to Peeak - a community built for connection, creativity, and respectful conversation. These
                  guidelines outline what's expected of every user to ensure Peeak remains a safe, welcoming and
                  thriving environment for everyone.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Values we Believe</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>
                    <strong>Respect:</strong> Treat everyone with basic human decency.
                  </li>
                  <li>
                    <strong>Safety:</strong> Keep the platform free from harm, hate, and exploitation.
                  </li>
                  <li>
                    <strong>Creativity:</strong> Express yourself, share ideas, and engage meaningfully.
                  </li>
                  <li>
                    <strong>Integrity:</strong> Be honest and authentic in your interactions.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Unwanted Behavior</h2>
                <p className="text-muted-foreground mb-2">
                  Every user is expected to maintain respectful behavior. You will NOT:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Harass, bully, or threaten other users.</li>
                  <li>Use hate speech, or discriminatory language.</li>
                  <li>Encourage or participate in mob-behavior.</li>
                  <li>Negatively affect and target individuals.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Prohibited Content</h2>
                <p className="text-muted-foreground mb-2">
                  The following types of content are strictly forbidden on Peeak:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>
                    <strong>Hate Speech or Harassment:</strong> Any language meant to demean or incite hostility.
                  </li>
                  <li>
                    <strong>Violence or Self-Harm:</strong> Content glorifying, threatening, or promoting harm.
                  </li>
                  <li>
                    <strong>Sexual or Explicit Content:</strong> Especially anything involving or depicting minors.
                  </li>
                  <li>
                    <strong>Spam and Scams:</strong> Unsolicited promotions, deceptive schemes, or malware links.
                  </li>
                  <li>
                    <strong>Illegal Activities:</strong> Anything that violates the law or encourages others to do so.
                  </li>
                  <li>
                    <strong>Doxxing:</strong> Posting private or identifying information about others without consent.
                  </li>
                </ul>
                <p className="text-muted-foreground mt-2 italic">
                  Any violation of these rules may result in content removal, suspension, or termination.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Responsible Discussion</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Keep posts and responses respectful and relevant.</li>
                  <li>Keep posts and discussions relevant to the topic.</li>
                  <li>Avoid spamming or repeatedly posting low-quality content.</li>
                  <li>Do not intentionally derail or disrupt conversations.</li>
                  <li>
                    When discussing sensitive topics, stay respectful and follow moderator directions if asked to drop
                    or change the subject.
                  </li>
                </ul>
                <p className="text-muted-foreground mt-2 italic">
                  Ignoring moderator instructions may lead to warnings, or temporary restrictions.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Privacy and Safety</h2>
                <p className="text-muted-foreground mb-2">Your safety is important and so is your privacy.</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Never share private information (yours or others) publicly.</li>
                  <li>Do not impersonate other users, moderators, or staff.</li>
                  <li>If you feel unsafe or harassed, use the Report feature or contact moderation immediately.</li>
                  <li>Do not share screenshots or messages from private spaces without consent.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Reporting and Enforcement</h2>
                <p className="text-muted-foreground mb-2">
                  If you see anything that violates these guidelines, please report it rather than engage. Reports help
                  keep the platform safe and allow moderators to act quickly and effectively.
                </p>
                <p className="text-muted-foreground mb-2">Moderators may take actions such as:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Removing content</li>
                  <li>Issuing verbal or written warnings</li>
                  <li>Temporarily suspending accounts</li>
                  <li>Permanently banning accounts for repeated or severe violations</li>
                </ul>
                <p className="text-muted-foreground mt-2 italic">
                  Moderation decisions are made to protect the community.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Community Integrity</h2>
                <p className="text-muted-foreground mb-2">
                  Peeak thrives when users act with honesty and goodwill. Please avoid:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>False reporting to target others.</li>
                  <li>Manipulating posts, votes, or engagement.</li>
                  <li>Using multiple accounts to evade bans or mislead users.</li>
                </ul>
                <p className="text-muted-foreground mt-2 italic">
                  These actions undermine the platform's trust and will result in further disciplinary action.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Contributing Positively</h2>
                <p className="text-muted-foreground mb-2">You can help Peeak grow by:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Welcoming new members.</li>
                  <li>Sharing thoughtful or creative posts.</li>
                  <li>Encouraging discussions that bring insight, humor, or positivity.</li>
                  <li>Respecting the ongoing discussion and space.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Enforcement Transparency</h2>
                <p className="text-muted-foreground mb-2">
                  Moderators will aim to be transparent and fair in their actions.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>
                    If your content is removed or your account is restricted, most times you will receive a short
                    explanation.
                  </li>
                  <li>Moderation actions may be appealed if you believe there was an error.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">User Accountability</h2>
                <p className="text-muted-foreground mb-2">
                  Every user is responsible for their words and actions on Peeak. Users should:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Think before posting or replying - your tone and phrasing matter.</li>
                  <li>Accept the consequences when rules are broken.</li>
                  <li>Avoid deleting evidence after violating guidelines.</li>
                </ul>
                <p className="text-muted-foreground mt-2 italic">
                  Accountability keeps Peeak a fair, safe, and thriving community.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Appeals and Disputes</h2>
                <p className="text-muted-foreground mb-2">
                  If you believe a mistake was made during moderation, you may appeal.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Appeals should be respectful, brief, and directed to moderation staff.</li>
                  <li>Appeals that include insults, spam, or hostility will be immediately denied.</li>
                </ul>
                <p className="text-muted-foreground mb-2 mt-3">During an active appeal:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Do not attempt to evade penalties using alternate accounts.</li>
                  <li>Allow time for moderators to review the case.</li>
                </ul>
                <p className="text-muted-foreground mt-2 italic">
                  Moderation reviews are taken with care and integrity across the platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Content Creation and Sharing</h2>
                <p className="text-muted-foreground mb-2">
                  Peeak encourages users to create, upload, share, and collaborate on content. When posting or sharing,
                  users should:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Only upload content they own or have permission to use.</li>
                  <li>Give proper credit when sharing someone else's work.</li>
                  <li>Avoid reposting, copying, or editing other people's content without consent.</li>
                  <li>Ensure all shared media follows Peeak's safety and content policies.</li>
                  <li>Avoid misleading thumbnails, titles, or clickbait-styled posts.</li>
                </ul>
              </section>

              <section className="pt-4 border-t border-border">
                <p className="text-center font-medium text-foreground">
                  Thank you for keeping the Peeak community worth reaching for.
                </p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

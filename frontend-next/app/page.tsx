import Link from "next/link";
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-widest text-neutral-500">V7 Index</div>
                      <div className="mt-1 text-2xl font-semibold text-pink-300">
                        {formatNumber(g.v7_index, 1)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold">市場洞察</h2>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <div className="text-neutral-500">社群之王</div>
                  <div className="mt-1 text-lg font-medium">{text(data.highlights.social_king, "暫無資料")}</div>
                </div>
                <div>
                  <div className="text-neutral-500">Rising Star</div>
                  <div className="mt-1 text-base text-cyan-300">
                    {data.highlights.rising_stars.length ? data.highlights.rising_stars.join(" · ") : "暫無資料"}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500">Heat Drop</div>
                  <div className="mt-1 text-base text-amber-300">
                    {data.highlights.heat_drop.length ? data.highlights.heat_drop.join(" · ") : "暫無資料"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold">成員排行 Top 10</h2>
              <div className="mt-4 space-y-3">
                {data.members.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-neutral-400">
                    尚無成員排行資料
                  </div>
                ) : (
                  data.members.map((m, idx) => (
                    <div
                      key={`${m.name}-${idx}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div>
                        <div className="text-sm text-neutral-400">#{formatInteger(m.rank || idx + 1)}</div>
                        <div className="mt-1 text-lg font-medium">{text(m.name)}</div>
                        <div className="mt-1 text-sm text-neutral-400">
                          {text(m.group)} ・ 社群活躍 {formatInteger(m.social_activity)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs uppercase tracking-widest text-neutral-500">Temperature</div>
                        <div className="mt-1 text-2xl font-semibold text-cyan-300">
                          {formatNumber(m.temperature_index, 1)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  awardPoints,
  changeSort,
  clearAwardError,
  fetchFirstPage,
  fetchMyEntry,
  fetchNextPage,
} from '../store/leaderboardSlice';
import LeaderboardRow from './LeaderboardRow';
import SortBar from './SortBar';
import MyRankCard from './MyRankCard';
import AwardModal from './AwardModal';
import AppButton from './AppButton';
import type { LeaderboardEntry } from '../types';

/**
 * One list, two modes:
 *  - editable=false (STUDENT): read-only rows + "my rank" card
 *  - editable=true  (TEACHER): rows are tappable and open the award dialog
 */
export default function LeaderboardList({ editable }: { editable: boolean }) {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const me = useAppSelector((s) => s.auth.user);
  const { items, status, error, sortBy, direction, totalElements, myEntry, awarding, awardError } = useAppSelector(
    (s) => s.leaderboard,
  );
  const [selected, setSelected] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    dispatch(fetchFirstPage());
    if (!editable) dispatch(fetchMyEntry());
  }, [dispatch, editable]);

  // keep the student's own card in sync whenever the list reloads
  useEffect(() => {
    if (!editable && status === 'succeeded') dispatch(fetchMyEntry());
  }, [dispatch, editable, status, items.length]);

  const onRefresh = useCallback(() => {
    dispatch(fetchFirstPage({ refreshing: true }));
  }, [dispatch]);

  const onEnd = useCallback(() => {
    dispatch(fetchNextPage());
  }, [dispatch]);

  const closeModal = () => {
    setSelected(null);
    dispatch(clearAwardError());
  };

  const submitAward = async (points: number) => {
    if (!selected) return;
    const result = await dispatch(awardPoints({ studentId: selected.studentId, points }));
    if (awardPoints.fulfilled.match(result)) closeModal();
  };

  const renderItem = useCallback(
    ({ item }: { item: LeaderboardEntry }) => (
      <LeaderboardRow
        entry={item}
        isMe={item.userId === me?.id}
        onPress={editable ? () => setSelected(item) : undefined}
      />
    ),
    [editable, me?.id],
  );

  const initialLoading = status === 'loading' && items.length === 0;

  return (
    <View style={{ flex: 1 }}>
      {!editable && <MyRankCard entry={myEntry} total={totalElements} />}
      {editable && (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Tap a student to award or deduct points · {totalElements} students
        </Text>
      )}
      <SortBar sortBy={sortBy} direction={direction} onChange={(s, d) => dispatch(changeSort(s, d))} />

      {initialLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
      ) : status === 'failed' && items.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: colors.danger, textAlign: 'center', marginBottom: 12 }}>{error?.message}</Text>
          <AppButton title="Retry" onPress={() => dispatch(fetchFirstPage())} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.studentId)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReached={onEnd}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={status === 'refreshing'} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListFooterComponent={
            status === 'loadingMore' ? <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} /> : undefined
          }
          ListEmptyComponent={
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>No students yet.</Text>
          }
        />
      )}

      {editable && (
        <AwardModal
          student={selected}
          submitting={awarding}
          error={awardError}
          onClose={closeModal}
          onSubmit={submitAward}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 13, paddingHorizontal: 16, paddingBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  center: { alignItems: 'center', padding: 24 },
});
